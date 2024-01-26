async function start() {
	const isWebGPUSupported = navigator.gpu !== undefined;
	if (!isWebGPUSupported) {
		alert("WebGPU is not supported");
		return;
	}

	const code: string = await (await fetch("./src/shaders.wgsl")).text();

	const domElement = document.createElement("canvas");
	document.body.appendChild(domElement);
	domElement.width = 500;
	domElement.height = 500;

	const adapter: GPUAdapter = <GPUAdapter> await navigator.gpu.requestAdapter();
	const device: GPUDevice = <GPUDevice> await adapter?.requestDevice();
	const context: GPUCanvasContext = <GPUCanvasContext> domElement.getContext("webgpu");
	const format: GPUTextureFormat = "bgra8unorm";
	context.configure({
		device,
		format,
	});

	const pipeline: GPURenderPipeline = device.createRenderPipeline({
		vertex: {
			module: device.createShaderModule({
				code,
			}),
			entryPoint: "vs_main",
		},
		layout: "auto",
		fragment: {
			module: device.createShaderModule({
				code,
			}),
			entryPoint: "fs_main",
			targets: [{
				format,
			}],
		},
		primitive : {
			topology: "triangle-list",
		},
	});
	const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();
	const textureView: GPUTextureView = context.getCurrentTexture().createView();
	const renderPass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
		colorAttachments: [{
			view: textureView,
			clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
			loadOp: "clear",
			storeOp: "store",
		}],
	});
	renderPass.setPipeline(pipeline);
	renderPass.draw(3, 1, 0, 0);
	renderPass.end();

	device.queue.submit([commandEncoder.finish()]);
}

start();
