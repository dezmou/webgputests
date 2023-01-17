#include <stdint.h>

typedef struct {
	uint32_t word[8];
} sha256hash_t;

sha256hash_t sha256sum(int *message);
unsigned char* sha256_to_string(sha256hash_t hash);