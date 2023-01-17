#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include "sha256.h"

int main( ){

	unsigned char input[]  = {0x69};

	sha256hash_t result = sha256sum((unsigned char*)input);
    printf("%s\n", sha256_to_string(result));

	return 0;
}