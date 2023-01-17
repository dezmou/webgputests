import React, { useEffect } from 'react';
// import "@webgpu/types"

function App() {

  useEffect(() => {
    ; (async () => {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) { return; }
      const device = await adapter.requestDevice();


      // First Matrix

      const firstMatrix = new Uint32Array([5,5]);

      const gpuBufferFirstMatrix = device.createBuffer({
        mappedAtCreation: true,
        size: firstMatrix.byteLength,
        usage: GPUBufferUsage.STORAGE,
      });
      const arrayBufferFirstMatrix = gpuBufferFirstMatrix.getMappedRange();
      new Int32Array(arrayBufferFirstMatrix).set(firstMatrix);
      gpuBufferFirstMatrix.unmap();

      // Result Matrix
      const resultMatrixBufferSize = firstMatrix.byteLength;
      const resultMatrixBuffer = device.createBuffer({
        size: resultMatrixBufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
      });

      const bindGroupLayout = (device as any).createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
              type: "read-only-storage"
            }
          },
          {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
              type: "storage"
            }
          }
        ]
      });

      const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: gpuBufferFirstMatrix
            }
          },
          {
            binding: 1,
            resource: {
              buffer: resultMatrixBuffer
            }
          }
        ]
      });

      const shaderModule = device.createShaderModule({
        code: /*WGSL*/`
          struct SHA256_CTX {
            data : array<u32, 64>,
            datalen : u32,
            bitlen : u32,
            state : array<u32, 8>,
            info : u32,
          };

          @group(0) @binding(0) var<storage, read> text1 : array<u32>;
          @group(0) @binding(1) var<storage, read_write> result : array<u32>;

          const SHA256_BLOCK_SIZE = 32;

          const k = array<u32, 64> (
            0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
            0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
            0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
            0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
            0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
            0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
            0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
            0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
          );


          fn ROTLEFT(a : u32, b : u32) -> u32{return (((a) << (b)) | ((a) >> (32-(b))));}
          fn ROTRIGHT(a : u32, b : u32) -> u32{return (((a) >> (b)) | ((a) << (32-(b))));}

          fn CH(x : u32, y : u32, z : u32) -> u32{return (((x) & (y)) ^ (~(x) & (z)));}
          fn MAJ(x : u32, y : u32, z : u32) -> u32{return (((x) & (y)) ^ ((x) & (z)) ^ ((y) & (z)));}
          fn EP0(x : u32) -> u32{return (ROTRIGHT(x,2) ^ ROTRIGHT(x,13) ^ ROTRIGHT(x,22));}
          fn EP1(x : u32) -> u32{return (ROTRIGHT(x,6) ^ ROTRIGHT(x,11) ^ ROTRIGHT(x,25));}
          fn SIG0(x : u32) -> u32{return (ROTRIGHT(x,7) ^ ROTRIGHT(x,18) ^ ((x) >> 3));}
          fn SIG1(x : u32) -> u32{return (ROTRIGHT(x,17) ^ ROTRIGHT(x,19) ^ ((x) >> 10));}

          fn sha256_transform(ctx : ptr<function, SHA256_CTX>)
          {
            // WORD a, b, c, d, e, f, g, h, i, j, t1, t2, m[64];
            var a : u32;
            var b : u32;
            var c : u32;
            var d : u32;
            var e : u32;
            var f : u32;
            var g : u32;
            var h : u32;
            var i : u32 = 0;
            var j : u32 = 0;
            var t1 : u32;
            var t2 : u32;
            var m : array<u32, 64> ;


            while(i < 16) {
              m[i] = ((*ctx).data[j] << 24) | ((*ctx).data[j + 1] << 16) | ((*ctx).data[j + 2] << 8) | ((*ctx).data[j + 3]);
              i++;
              j += 4;
            }            

            while(i < 64) {
          		m[i] = SIG1(m[i - 2]) + m[i - 7] + SIG0(m[i - 15]) + m[i - 16];
              i++;
            }

            a = (*ctx).state[0];
            b = (*ctx).state[1];
            c = (*ctx).state[2];
            d = (*ctx).state[3];
            e = (*ctx).state[4];
            f = (*ctx).state[5];
            g = (*ctx).state[6];
            h = (*ctx).state[7];

            i = 0;
            for (; i < 64; i++) {
              t1 = h + EP1(e) + CH(e,f,g) + k[i] + m[i];
              t2 = EP0(a) + MAJ(a,b,c);
              h = g;
              g = f;
              f = e;
              e = d + t1;
              d = c;
              c = b;
              b = a;
              a = t1 + t2;
            }


            (*ctx).state[0] += a;
            (*ctx).state[1] += b;
            (*ctx).state[2] += c;
            (*ctx).state[3] += d;
            (*ctx).state[4] += e;
            (*ctx).state[5] += f;
            (*ctx).state[6] += g;
            (*ctx).state[7] += h;
          }


          fn sha256_update(ctx : ptr<function, SHA256_CTX>, len : u32)
          {
            for (var i: u32 = 0; i < len; i++) {
              (*ctx).data[(*ctx).datalen] = text1[i];
              (*ctx).datalen ++;
              if ((*ctx).datalen == 64) {
                sha256_transform(ctx);
                (*ctx).bitlen += 512;
                (*ctx).datalen = 0;
              }
            }
          }
      
          fn sha256_final(ctx : ptr<function, SHA256_CTX>, hash:  ptr<function, array<u32, SHA256_BLOCK_SIZE>>  )
          {
            var i : u32 = (*ctx).datalen;
          
            // // Pad whatever data is left in the buffer.
            if ((*ctx).datalen < 56) {
              (*ctx).data[i] = 0x80;
              i++;
              while (i < 56) {
                (*ctx).data[i] = 0;
                i++;
              }

            }
            else {
              (*ctx).data[i] = 0x80;
              i++;
              while (i < 64) {
                (*ctx).data[i] = 0x00;
                i++;
              }
              sha256_transform(ctx);
              for (var i = 0; i < 56 ; i++) {
                (*ctx).data[i] = 0;
              }
            }
          
            // Append to the padding the total message's length in bits and transform.
            (*ctx).bitlen += (*ctx).datalen * 8;
            (*ctx).data[63] = (*ctx).bitlen;
            (*ctx).data[62] = (*ctx).bitlen >> 8;
            (*ctx).data[61] = (*ctx).bitlen >> 16;
            (*ctx).data[60] = (*ctx).bitlen >> 24;
            (*ctx).data[59] = (*ctx).bitlen >> 32;
            (*ctx).data[58] = (*ctx).bitlen >> 40;
            (*ctx).data[57] = (*ctx).bitlen >> 48;
            (*ctx).data[56] = (*ctx).bitlen >> 56;

            result[0] = ((*ctx).data[59]);


            // sha256_transform(ctx);
          
            // Since this implementation uses little endian byte ordering and SHA uses big endian,
            // reverse all the bytes when copying the final state to the output hash.
            for (var i : u32 = 0; i < 4; i++) {
              (*hash)[i]      = ((*ctx).state[0] >> (24 - i * 8)) & 0x000000ff;
              (*hash)[i + 4]  = ((*ctx).state[1] >> (24 - i * 8)) & 0x000000ff;
              (*hash)[i + 8]  = ((*ctx).state[2] >> (24 - i * 8)) & 0x000000ff;
              (*hash)[i + 12] = ((*ctx).state[3] >> (24 - i * 8)) & 0x000000ff;
              (*hash)[i + 16] = ((*ctx).state[4] >> (24 - i * 8)) & 0x000000ff;
              (*hash)[i + 20] = ((*ctx).state[5] >> (24 - i * 8)) & 0x000000ff;
              (*hash)[i + 24] = ((*ctx).state[6] >> (24 - i * 8)) & 0x000000ff;
              (*hash)[i + 28] = ((*ctx).state[7] >> (24 - i * 8)) & 0x000000ff;
            }
          }

          @compute @workgroup_size(1, 1)
          fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            var ctx : SHA256_CTX;
            var buf : array<u32, SHA256_BLOCK_SIZE>;

            // CTX INIT
            ctx.datalen = 0;
            ctx.bitlen = 0;
            ctx.state[0] = 0x6a09e667;
            ctx.state[1] = 0xbb67ae85;
            ctx.state[2] = 0x3c6ef372;
            ctx.state[3] = 0xa54ff53a;
            ctx.state[4] = 0x510e527f;
            ctx.state[5] = 0x9b05688c;
            ctx.state[6] = 0x1f83d9ab;
            ctx.state[7] = 0x5be0cd19;


            var len : u32 = 2;
            sha256_update(&ctx, len);
            sha256_final(&ctx, &buf);

            // let index = global_id.x;
            // result[0] = buf[25];
            // result[1] = buf[26];
          }
        `
      });

      const computePipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({
          bindGroupLayouts: [bindGroupLayout]
        }),
        compute: {
          module: shaderModule,
          entryPoint: "main"
        }
      });

      const commandEncoder = device.createCommandEncoder();

      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(computePipeline);
      passEncoder.setBindGroup(0, bindGroup);

      passEncoder.dispatchWorkgroups(1, 1);
      passEncoder.end();

      // Get a GPU buffer for reading in an unmapped state.
      const gpuReadBuffer = device.createBuffer({
        size: resultMatrixBufferSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
      });

      // Encode commands for copying buffer to buffer.
      commandEncoder.copyBufferToBuffer(
        resultMatrixBuffer /* source buffer */,
        0 /* source offset */,
        gpuReadBuffer /* destination buffer */,
        0 /* destination offset */,
        resultMatrixBufferSize /* size */
      );

      // Submit GPU commands.
      const gpuCommands = commandEncoder.finish();
      device.queue.submit([gpuCommands]);

      await gpuReadBuffer.mapAsync(GPUMapMode.READ);
      const arrayBuffer = gpuReadBuffer.getMappedRange();
      console.log(new Uint32Array(arrayBuffer));
    })()
  }, [])
  return <>
    chien
  </>
    ;
}

export default App;


