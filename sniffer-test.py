from scapy.all import *
# sniff(filter="ip", prn=lambda x:x.sprintf("{IP:%IP.src% -> %IP.dst%\n}{Raw:%Raw.load%\n}"))
def process_packet(packet):
    raw_data = bytes(packet)
    # print(raw_data)
        # Print hexadecimal representation
    # hex_representation = ' '.join([format(byte, '08b') for byte in raw_data])
    bin_representation = ''.join([format(byte, '08b') for byte in raw_data])
    print(''.join(map(str,bitstuff(bin_representation))))
    # print(f"Hexadecimal: {bin_representation}\n")

    # Print ASCII representation
    # ascii_representation = raw_data.decode('utf-8', errors='replace')
    # print(f"ASCII: {ascii_representation}")
def bitstuff(bin_string):
    MAX_BITS_IN_A_ROW = 5
    final_product = []
    ones_in_a_row = 0
    for bit in bin_string:
        final_product.append(int(bit))
        if bit == "1":
            ones_in_a_row += 1
            if ones_in_a_row == MAX_BITS_IN_A_ROW:
                final_product.append(0)
                ones_in_a_row = 0
    return final_product

def read_pcapng_file(fpath):
    packets = rdpcap(fpath)
    for packet in packets:
        process_packet(packet)

if __name__ == "__main__":
    read_pcapng_file("./random capture.pcapng")


# IFACES.show()
# iface = "Intel(R) Wi-Fi 6 AX201 160MHz"
# socket = conf.L2socket(iface=iface)
# ### RECV
# packet_raw = socket.recv_raw()[0]  # Raw data
# packet_decoded = socket.recv() # Using the library (also contains things like sent time...)
