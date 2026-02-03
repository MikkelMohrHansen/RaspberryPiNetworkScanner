#!/usr/bin/env python3

import scapy.all as scapy
from optparse import OptionParser
from datetime import datetime
from Database.DB_Data import add_unapproved

class NetworkScanner:
    def __init__(self, target):
        self.target = target

    def scan_arp(self):
        arp_request = scapy.ARP(pdst=self.target)
        broadcast = scapy.Ether(dst="ff:ff:ff:ff:ff:ff")
        arp_request_broadcast = broadcast/arp_request
        answered_list = scapy.srp(arp_request_broadcast, timeout=1, verbose=False)[0]

        client_list = []
        for response in answered_list:
            client_dict = {"IP": response[1].psrc, "MAC": response[1].hwsrc}
            client_list.append(client_dict)
        return client_list

    def display_result(self, response_list):
        print(41 * "_", "\n", "IP\t\t\t\tMAC Address", "\n", 40 * "-")
        for response in response_list:
            print(f"{response['IP']}\t\t{response['MAC']}")
        print(40 * "-")
    
    def send_to_db(self, response_list):
        for d in response_list:
            ip = d['IP']
            mac = d['MAC']
            if ip and mac:
                add_unapproved(ip, mac)
        print("Data inserted into UnapprovedAddresses table.")

def main():
    parser = OptionParser()
    parser.add_option("-t", "--target", dest="target", help="Target IP range to scan, e.g. 10.0.2.1/24")
    (options, args) = parser.parse_args()

    if not options.target:
        parser.error("[-] Please specify a target IP range, use --help for more info.")
        return  # Stop execution if no target is provided

    scanner = NetworkScanner(options.target)
    scan_result = scanner.scan_arp()
    scanner.display_result(scan_result)
    scanner.send_to_db(scan_result)
if __name__ == "__main__":
    main()