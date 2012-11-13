from __future__ import print_function
import serial
import os
import requests
import json
import re
PORT = "COM1"
cashiers = ['a','b']
class Transaction:
    def __init__(self):
        self.items = []

    def addItem(self,item):
        self.items.append(item)
    def finalize(self):
        


def create_connection():
    if os.name == 'posix':
        PORT = "/dev/ttyUSB0"
    elif os.name == "nt":
        PORT = "COM1"
    return serial.Serial(PORT,9600,timeout = 1)

def query_price(barcode):
    payload = {
        'barcode':barcode,
        'cashier':1
        }
    res = requests.post("http://localhost:3000/getPrice",data=payload)
    resd = json.loads(res.text)
    return resd["price"]

def handle(barcode, quantity, ser_write):
    if len(barcode) != 8:
        print("error: invalid barcode")
        return
    price = query_price(barcode)
    print("price: "+str(price))
    ser_write(price)
    
def parse(message):
    m = re.search('([0-9]{8}):([0-9]{4})',message)
    return m.groups(0), m.groups(1)

def poll():
    ser = create_connection()
    ser_write = lambda x: ser.write(x)
    for cid in cashiers:
        ser.write(cid)
        fst = ser.read(1)
        #provisional as of now I echo the id.
        if fst!= cid:
            barcode, quantity = parse(fst + ser.read(11))
            handle(barcode, quantity, ser_write)
    

#if __name__ == '__main__':
    
