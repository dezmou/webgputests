import React, { useEffect } from 'react';
// import "@webgpu/types"

function App() {

  useEffect(() => {
    ; (async () => {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) { return; }
      const device = await adapter.requestDevice();


      // First Matrix

      const firstMatrix = new Int32Array([69,69]);

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
          };

          @group(0) @binding(0) var<storage, read> data : array<u32>;
          @group(0) @binding(1) var<storage, read_write> result : array<u32>;

          const WORD = array<u32, 64> (
            0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
            0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
            0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
            0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
            0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
            0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
            0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
            0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
          );

          fn sha256_update(ctx : ptr<function, SHA256_CTX> , len : u32)
          {
            for (var i: u32 = 0; i < len; i++) {
              (*ctx).data[(*ctx).datalen] = data[i];
              (*ctx).datalen ++;
              if ((*ctx).datalen == 64){
              //     sha256_transform(ctx, ctx->data);
              (*ctx).bitlen += 512;
              (*ctx).datalen = 0;
              }
            }
          }
      
          @compute @workgroup_size(1, 1)
          fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            var ctx : SHA256_CTX;
            
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

            // let index = global_id.x;
            result[0] = ctx.datalen;
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
      console.log(new Int32Array(arrayBuffer));
    })()
  }, [])
  return <>
    chien
  </>
    ;
}

export default App;


