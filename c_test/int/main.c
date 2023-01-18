/*********************************************************************
* Filename:   sha256.c
* Author:     Brad Conte (brad AT bradconte.com)
* Copyright:
* Disclaimer: This code is presented "as is" without any guarantees.
* Details:    Performs known-answer tests on the corresponding SHA1
	          implementation. These tests do not encompass the full
	          range of available test vectors, however, if the tests
	          pass it is very, very likely that the code is correct
	          and was compiled properly. This code also serves as
	          example usage of the functions.
*********************************************************************/

/*************************** HEADER FILES ***************************/
#include <stdio.h>
#include <memory.h>
#include <string.h>
#include "sha256.h"

int main()
{
	SHA256_CTX ctx;
    BYTE text1[] = {0x69, 0x69};
    // BYTE text1[] = {5, 5};
	BYTE buf[SHA256_BLOCK_SIZE];
	sha256_init(&ctx);
	sha256_update(&ctx, text1, 2);
	sha256_final(&ctx, buf);
    printf("%02x%02x%02x%02x\n", buf[0], buf[1], buf[2], buf[3]);

	return(0);
}