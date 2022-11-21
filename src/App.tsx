import React, { useEffect } from 'react';
// import "@webgpu/types"

function App() {

  useEffect(() => {
    ; (async () => {
      async function testWebGPU() {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          return;
        }
        const device = await adapter.requestDevice();
        console.log(device ? 'WebGPU works' : ':(');

        writeToBufferFromJS(device);
        // await writeCopyAndReadBuffer(device);
        await matrixMultiplication(device);
      }

      function writeToBufferFromJS(device : GPUDevice) {
        // Get a GPU buffer in a mapped state and an arrayBuffer for writing.
        const gpuBuffer = device.createBuffer({
          // map at creation
          // so that it is owned by the CPU
          // and accessible to read/write from JS
          // For a GPU to be able to access a buffer
          // it needs to be unmapped: gpuBuffer.unmap()
          // The concept of map/unmapped is needed
          // to prevent race conditions when GPU and CPU
          // access memory at the same time.
          mappedAtCreation: true,
          size: 4,
          usage: GPUBufferUsage.MAP_WRITE,
        });
        // Returns an ArrayBuffer with the raw binary data
        const arrayBuffer = gpuBuffer.getMappedRange();

        // Write bytes to buffer
        // using a TypedArray
        const array = new Uint8Array(arrayBuffer);
        array.set([0, 1, 2, 3]);
      }

      async function matrixMultiplication(device: GPUDevice) {
        // Result Matrix
        const resultMatrixBufferSize = Float32Array.BYTES_PER_ELEMENT * 64
        const resultMatrixBuffer = device.createBuffer({
          size: resultMatrixBufferSize,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });

        const bindGroupLayout = device.createBindGroupLayout({
          entries: [
            {
              binding: 0,
              visibility: GPUShaderStage.COMPUTE,
              buffer: {
                type: 'storage',
              },
            },
          ],
        }as any);

        const bindGroup = device.createBindGroup({
          layout: bindGroupLayout,
          entries: [
            {
              binding: 0,
              resource: {
                buffer: resultMatrixBuffer,
              },
            },
          ],
        });

        const shaderModule = device.createShaderModule({
          code: /* wgsl */`
            @group(0) @binding(0) var<storage, read_write> resultMatrix : array<f32>;
      
            @compute @workgroup_size(8, 8)
            fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
              resultMatrix[0] = 14;
            }
          `,
        });

        const computePipeline = device.createComputePipeline({
          layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
          }),
          compute: {
            module: shaderModule,
            entryPoint: 'main',
          },
        });


        const commandEncoder = device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(computePipeline);
        passEncoder.setBindGroup(0, bindGroup);
        // In GPU compute encoding a comand to execute a kernel function on a set
        // of data is called dispatching.
        passEncoder.dispatchWorkgroups(1, 1);
        passEncoder.end();

        const gpuReadBuffer = device.createBuffer({
          size: resultMatrixBufferSize,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

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

        // Read buffer.
        await gpuReadBuffer.mapAsync(GPUMapMode.READ);
        const arrayBuffer = gpuReadBuffer.getMappedRange();
        console.log('matrix: ', new Float32Array(arrayBuffer));
      }

      testWebGPU();

    })()
  }, [])
  return <>
    chien
  </>
    ;
}

export default App;


