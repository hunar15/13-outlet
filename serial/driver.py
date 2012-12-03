from __future__ import print_function
import serial
import os
import requests
import json
import re
PORT = "COM1"
PRE_ADDRESS = '```'
EOT_CHAR = '}'
RECV_PAYLOAD_LEN = 15
SEND_PAYLOAD_LEN = 7
cashiers = {'ab': '0001'}
shoppc = "http://localhost:3000"


class Transaction:
    def __init__(self):
        self.items = {}
        for i in cashiers:
            self.items[i] = {}

    def addItem(self, cashier, item):
        self.items[cashier][item['barcode']] = item

    def getBill(self, cashier):
        total = 0
        print(self.items[cashier])
        for b in self.items[cashier]:
            total += float(self.items[cashier][b]['price'] * self.items[cashier][b]['quantity'])
        return "{0:.2f}".format(total)

    def finalize(self, cashier):
        item = []
        #convert dict to list
        for barcode in self.items[cashier]:
            item.append(self.items[cashier][barcode])

        payload = {
            'cashier': cashiers[cashier],
            'list': item
            }
        print(json.dumps(payload))
        headers = {'content-type': 'application/json'}
        res = requests.post(shoppc + '/processTransaction', data = json.dumps(payload), headers = headers)
        print(res.text)


def item_wrap(barcode, quantity, price):
    d = {
        'barcode': barcode,
        'quantity': int(quantity),
        'price': price
        }
    return d


def create_connection():
    if os.name == 'posix':
        PORT = "/dev/ttyUSB1"
    elif os.name == "nt":
        PORT = "COM1"
    return serial.Serial(PORT, 9600, timeout = 0.5)


def query_price(barcode, cid):
    payload = {
        'barcode': barcode,
        'cashier': cid
        }
    res = requests.post(shoppc+"/getPrice", data=payload)
    resd = json.loads(res.text)
    return resd["price"]


def handle(cid, barcode, quantity, t):
    if len(barcode) != 8:
        print("error: invalid barcode")
        return
    price = query_price(barcode, cid)
    print("price: " + str(price))
    t.addItem(cid, item_wrap(barcode, quantity, price))
    return price


def parse(message):
    if len(message) != RECV_PAYLOAD_LEN - 2:
        print(message + "is illegal")
        return
    m = re.search('([0-9]{8}):([0-9]+)', message)
    return m.groups(0)


def main():
    ser = create_connection()
    ser_write = lambda x: ser.write(str(x).zfill(SEND_PAYLOAD_LEN))
    ser_read = lambda x: ser.read(x)
    transactions = Transaction()
    while(True):
        for cid in cashiers:
            ser.write(PRE_ADDRESS)
            ser.write(cid)
            fst = ser.read(1)
        #provisional as of now I echo the id.
            if fst == '!':
                rest = ser.read(RECV_PAYLOAD_LEN - 2)
            # get the #|!
                ser.read(1)
                whole = rest
                print(whole)
                barcode, quantity = parse(whole)
                price = handle(cid, barcode, quantity, transactions)
                print(price)
                ser_write(price)
                price_ack = ser_read(7)
                print("price ack : " + price_ack)
                eot = ser_read(1)
                while eot == '':
                    print("waiting")
                    eot = ser_read(1)
                if (eot == "}"):
                    transactions.finalize(cid)
                    ser_write(str(transactions.getBill(cid)))
                elif (eot == "@"):
                    print("new item!")



#if __name__ == '__main__':
#    poll()
def main_test():
    #ser = create_connection()
    ser_write = lambda x: print(x)
    ser_read = lambda x: raw_input()
    transactions = Transaction()
    while(True):
        for cid in cashiers:
            ser_write(PRE_ADDRESS)
            ser_write(cid)
            fst = ser_read(1)
        #provisional as of now I echo the id.
            if fst == '!':
                rest = ser_read(RECV_PAYLOAD_LEN - 1)
                # get the #|!
                ser_read(1)
                whole = rest
                print(whole)
                barcode, quantity = parse(whole)
                price = handle(cid, barcode, quantity, transactions)
                ser_write(price)
                price_ack = ser_read(7)
                print("price ack : " + price_ack)
                eot = ser_read(1)
                print("eot="+eot)
                while(eot==''):
                    print("waiting")
                    eot = ser_read(1)
                if (eot == "}"):
                    transactions.finalize(cid)
                    ser_write(str(transactions.getBill(cid)))


def test():
    inp = lambda x: raw_input()
    outp = lambda x: print(x)
    bar = '30011470'
    quantity = 1000
    t = Transaction()
    handle(0x01, bar, quantity, t, outp, inp)
    b2 = '18243337'
    handle(0x01, b2, quantity, t, outp, inp)


def ft():
    f = open("/home/omer/Projects/cashier/TIMER.HEX")
    return f.read()

print("fuck")
