from __future__ import print_function
import serial
import os
import requests
import json
import re
PORT = "COM1"
cashiers = {'a':'0001'}#,'b':'0002','c':'0003'}
shoppc = "http://localhost:3000"
class Transaction:
    def __init__(self):
        self.items = {}
        for i in cashiers:
            self.items[i]=[]

    def addItem(self,cashier,item):
        self.items[cashier].append(item)
    def finalize(self, cashier):
        item = self.items[cashier]
        payload = {
            'cashier': cashiers[cashier],
            'list': item
            }
        print(json.dumps(payload))
        headers = {'content-type': 'application/json'}#,'accept': 'text/plain'}
        res = requests.post(shoppc+'/processTransaction', data=json.dumps(payload), headers=headers)
        print(res.text)
        
        

def item_wrap(barcode, quantity, price):
    d = {
        'barcode':barcode,
        'quantity':int(quantity),
        'price': price
        }
    return d


def create_connection():
    if os.name == 'posix':
        PORT = "/dev/ttyUSB1"
    elif os.name == "nt":
        PORT = "COM1"
    return serial.Serial(PORT,9600,timeout = 0.5)

def query_price(barcode, cid):
    payload = {
        'barcode':barcode,
        'cashier':cid
        }
    res = requests.post(shoppc+"/getPrice",data=payload)
    resd = json.loads(res.text)
    return resd["price"]

def handle(cid, barcode, quantity, t, ser_write, ser_read):
    if len(barcode) != 8:
        print("error: invalid barcode")
        return
    price = query_price(barcode, cid)
    print("price: "+str(price))
    ser_write(price)
    t.addItem(cid, item_wrap(barcode,quantity,price))
    h = ser_read(1)
    if h == "#":
        t.finalize(cid)

    
def parse(message):
    if len(message) != 13:
        print(message+"is illegal")
        return 
    m = re.search('([0-9]{8}):([0-9]+)',message)
    return m.groups(0)

def main():
    ser = create_connection()
    ser_write = lambda x: ser.write(str(x).zfill(8))
    ser_read = lambda x: ser.read(x)
    transactions = Transaction()
    for cid in cashiers:
        ser.write(cid)
        fst = ser.read(1)
        #provisional as of now I echo the id.
        if fst == '!':
            rest = ser.read(13)
            whole = rest
            print(whole)
            barcode, quantity = parse(whole)
            handle(cid, barcode, quantity,transactions, ser_write, ser_read)
            price_ack =ser_read(8)
            print("price ack : "+price_ack)
    

#if __name__ == '__main__':
#    poll()
    
def test():
    inp = lambda x: raw_input()
    outp = lambda x: print(x)
    bar = '30011470'
    quantity = 1000
    t = Transaction()
    handle('a',bar,quantity,t,outp,inp)
    b2 = '18243337'
    handle('a',b2,quantity, t,outp,inp)
