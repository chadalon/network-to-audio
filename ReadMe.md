
# Making some nasty wavs from network packets

Bc we could all use some new Serum wavetables amirite?
This thing converts network packets into audio (and has the option to alter the data via bit- or byte- stuffing to make it more realistic)

Currently it simply reads a pcapng file (I have provided a sample one) which was pre-captured.

## Get set up
1. You need node.js installed. After that, just run "npm install" and it should install the node dependencies.
2. You need python3 installed. Now run "pip install scapy"
3. Get some pcapng files (I used WireShark)
4. Congratulations! Now you should be able to run the program. "node index.js"

## The Vision

I want to:
- have this play audio based on live packet sniffing
- add more frame formats (BISYNC, etc. Currently it only alters data with HDLC bit-stuffing)