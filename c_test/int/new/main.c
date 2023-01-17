#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include "sha256.h"

int main( ){

	unsigned int input[]  = {0x69, 0x69};

	sha256hash_t result = sha256sum(input);
    printf("%s\n", sha256_to_string(result));

	return 0;
}