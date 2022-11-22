export default /* wgsl */`

struct Matrix {
    BYTE : i8,
    numbers: array<f32>,
}

@group(0) @binding(0) var<storage, read_write> resultMatrix : array<u32>;
@group(0) @binding(1) var<storage> input : array<u32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  var chien : i32 = 485;
  for (var i=0; i<5784;i++){
    chien += i;
    if (chien % 4500 == 0) {
      chien = 0;
    }
  }
  resultMatrix[global_id.x] = bitcast<u32>(input[0] + global_id.x + bitcast<u32>( chien));
}

`