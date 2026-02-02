import scapy.all as scapy
from optparse import OptionParser

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

def main():
    parser = OptionParser()
    parser.add_option("-t", "--target", dest="target", help="Target IP range to scan, e.g. 10.0.2.1/24")
    (options, args) = parser.parse_args()

    if not options.target:
        parser.error("[-] Please specify a target IP range, use --help for more info.")

    scanner = NetworkScanner(options.target)
    scan_result = scanner.scan_arp()
    scanner.display_result(scan_result)

if __name__ == "__main__":
    main()