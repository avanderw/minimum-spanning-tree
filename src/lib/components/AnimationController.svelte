<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Play, Pause, SkipForward, SkipBack, Square, RotateCcw } from 'lucide-svelte';

	export let steps: string[] = [];
	export let currentStep = 0;
	export let isPlaying = false;
	export let animationSpeed = 1000; // ms between steps
	export let autoPlay = false;

	const dispatch = createEventDispatcher();

	let intervalId: number | null = null;

	// Speed options
	const speeds = [
		{ label: '0.5x', value: 2000 },
		{ label: '1x', value: 1000 },
		{ label: '1.5x', value: 667 },
		{ label: '2x', value: 500 },
		{ label: '3x', value: 333 }
	];

	function play() {
		if (currentStep >= steps.length - 1) {
			currentStep = 0;
		}
		
		isPlaying = true;
		intervalId = setInterval(() => {
			if (currentStep < steps.length - 1) {
				nextStep();
			} else {
				pause();
			}
		}, animationSpeed);
		
		dispatch('play');
	}

	function pause() {
		isPlaying = false;
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
		dispatch('pause');
	}

	function stop() {
		pause();
		currentStep = 0;
		dispatch('step', currentStep);
		dispatch('stop');
	}

	function nextStep() {
		console.log(`🎬 CONTROLLER DEBUG: nextStep called - currentStep: ${currentStep}, steps.length: ${steps.length}`);
		if (currentStep < steps.length - 1) {
			currentStep += 1;
			console.log(`🎬 CONTROLLER DEBUG: Moving to step ${currentStep}`);
			dispatch('step', currentStep);
		} else {
			console.log('🎬 CONTROLLER DEBUG: Already at last step, cannot go further');
		}
	}

	function prevStep() {
		console.log(`🎬 CONTROLLER DEBUG: prevStep called - currentStep: ${currentStep}`);
		if (currentStep > 0) {
			currentStep -= 1;
			console.log(`🎬 CONTROLLER DEBUG: Moving to step ${currentStep}`);
			dispatch('step', currentStep);
		} else {
			console.log('🎬 CONTROLLER DEBUG: Already at first step, cannot go back');
		}
	}

	function goToStep(step: number) {
		pause();
		currentStep = Math.max(0, Math.min(steps.length - 1, step));
		dispatch('step', currentStep);
	}

	function togglePlayPause() {
		if (isPlaying) {
			pause();
		} else {
			play();
		}
	}

	// Auto-play functionality
	$: if (autoPlay && steps.length > 0 && !isPlaying) {
		play();
	}

	// Clean up interval on component destroy
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
	});
</script>

<div class="animation-controls">
	<div class="controls-header">
		<h3>Animation Controls</h3>
		<div class="speed-selector">
			<label for="speed">Speed:</label>
			<select id="speed" bind:value={animationSpeed}>
				{#each speeds as speed}
					<option value={speed.value}>{speed.label}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="progress-section">
		<div class="progress-bar">
			<input
				type="range"
				min="0"
				max={Math.max(0, steps.length - 1)}
				bind:value={currentStep}
				on:input={(e) => goToStep(Number(e.target.value))}
				disabled={steps.length === 0}
			/>
		</div>
		<div class="step-counter">
			Step {currentStep + 1} of {steps.length}
		</div>
	</div>

	<div class="control-buttons">
		<button 
			class="secondary"
			on:click={prevStep} 
			disabled={currentStep === 0 || steps.length === 0}
			title="Previous Step"
		>
			<SkipBack size={16} />
		</button>

		<button 
			class="primary"
			on:click={togglePlayPause}
			disabled={steps.length === 0}
			title={isPlaying ? 'Pause' : 'Play'}
		>
			{#if isPlaying}
				<Pause size={16} />
			{:else}
				<Play size={16} />
			{/if}
		</button>

		<button 
			class="secondary"
			on:click={nextStep} 
			disabled={currentStep >= steps.length - 1 || steps.length === 0}
			title="Next Step"
		>
			<SkipForward size={16} />
		</button>

		<button 
			class="secondary"
			on:click={stop}
			disabled={steps.length === 0}
			title="Reset to Start"
		>
			<RotateCcw size={16} />
		</button>
	</div>

	{#if steps.length > 0}
		<div class="current-step">
			<h4>Current Step:</h4>
			<p>{steps[currentStep] || 'No step information'}</p>
		</div>

		<details class="step-list">
			<summary>All Steps ({steps.length})</summary>
			<div class="steps-container">
				{#each steps as step, index}
					<div 
						class="step-item {index === currentStep ? 'active' : ''}"
						on:click={() => goToStep(index)}
						on:keydown={(e) => e.key === 'Enter' && goToStep(index)}
						role="button"
						tabindex="0"
					>
						<span class="step-number">{index + 1}.</span>
						<span class="step-text">{step}</span>
					</div>
				{/each}
			</div>
		</details>
	{:else}
		<div class="no-steps">
			<p>Run an algorithm to see animation steps</p>
		</div>
	{/if}
</div>

<style>
	.animation-controls {
		background: var(--pico-card-background-color, #ffffff);
		border: 1px solid var(--pico-muted-border-color, #e5e7eb);
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0;
	}

	.controls-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.controls-header h3 {
		margin: 0;
		color: var(--pico-color, #374151);
	}

	.speed-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.speed-selector label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--pico-color, #374151);
		white-space: nowrap;
	}

	.speed-selector select {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		border: 1px solid var(--pico-muted-border-color, #e5e7eb);
		background: var(--pico-card-background-color, #ffffff);
		color: var(--pico-color, #374151);
		font-size: 0.8rem;
		min-width: 60px;
	}

	.progress-section {
		margin-bottom: 1rem;
	}

	.progress-bar {
		margin-bottom: 0.5rem;
	}

	.progress-bar input[type="range"] {
		width: 100%;
		height: 6px;
		-webkit-appearance: none;
		appearance: none;
		background: var(--pico-muted-border-color, #e5e7eb);
		border-radius: 3px;
		outline: none;
		margin: 0;
	}

	.progress-bar input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		background: var(--pico-primary, #3b82f6);
		border-radius: 50%;
		cursor: pointer;
		border: 2px solid var(--pico-card-background-color, #ffffff);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.progress-bar input[type="range"]::-moz-range-thumb {
		width: 18px;
		height: 18px;
		background: var(--pico-primary, #3b82f6);
		border-radius: 50%;
		cursor: pointer;
		border: 2px solid var(--pico-card-background-color, #ffffff);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.step-counter {
		text-align: center;
		font-size: 0.85rem;
		color: var(--pico-muted-color, #6b7280);
		font-weight: 500;
	}

	.control-buttons {
		display: flex;
		gap: 0.4rem;
		justify-content: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.control-buttons button {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 2.5rem;
		height: 2.5rem;
		padding: 0.5rem;
		border-radius: 6px;
		border: 1px solid var(--pico-muted-border-color, #e5e7eb);
		background: var(--pico-card-background-color, #ffffff);
		color: var(--pico-color, #374151);
		cursor: pointer;
		transition: all 0.2s ease;
		margin: 0;
	}

	.control-buttons button:hover:not(:disabled) {
		background: var(--pico-secondary-background, #f8fafc);
		border-color: var(--pico-secondary, #6b7280);
		transform: translateY(-1px);
	}

	.control-buttons button.primary {
		background: var(--pico-primary, #3b82f6);
		color: white;
		border-color: var(--pico-primary, #3b82f6);
	}

	.control-buttons button.primary:hover:not(:disabled) {
		background: var(--pico-primary-hover, #2563eb);
		border-color: var(--pico-primary-hover, #2563eb);
	}

	.control-buttons button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.control-buttons button:disabled:hover {
		transform: none;
	}

	.current-step {
		background: var(--pico-secondary-background, rgba(59, 130, 246, 0.05));
		border-left: 3px solid var(--pico-primary, #3b82f6);
		padding: 1rem;
		border-radius: 0 6px 6px 0;
		margin-bottom: 1rem;
	}

	.current-step h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.8rem;
		color: var(--pico-primary, #3b82f6);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 600;
	}

	.current-step p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.4;
		color: var(--pico-color, #374151);
	}

	.step-list {
		margin-top: 1rem;
	}

	.step-list summary {
		cursor: pointer;
		padding: 0.75rem;
		border-radius: 4px;
		background: var(--pico-secondary-background, #f8fafc);
		font-weight: 500;
		color: var(--pico-color, #374151);
		transition: background-color 0.2s ease;
		border: 1px solid var(--pico-muted-border-color, #e5e7eb);
	}

	.step-list summary:hover {
		background: var(--pico-muted-border-color, #e5e7eb);
	}

	.steps-container {
		max-height: 300px;
		overflow-y: auto;
		margin-top: 0.5rem;
		border: 1px solid var(--pico-muted-border-color, #e5e7eb);
		border-radius: 4px;
		background: var(--pico-card-background-color, #ffffff);
	}

	.step-item {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem;
		border-bottom: 1px solid var(--pico-muted-border-color, #e5e7eb);
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.step-item:hover {
		background: var(--pico-secondary-background, #f8fafc);
	}

	.step-item.active {
		background: var(--pico-secondary-background, rgba(59, 130, 246, 0.05));
		border-left: 3px solid var(--pico-primary, #3b82f6);
	}

	.step-item:last-child {
		border-bottom: none;
	}

	.step-number {
		color: var(--pico-muted-color, #6b7280);
		font-size: 0.8rem;
		font-weight: 500;
		flex-shrink: 0;
		min-width: 2rem;
	}

	.step-item.active .step-number {
		color: var(--pico-primary, #3b82f6);
		font-weight: 600;
	}

	.step-text {
		font-size: 0.85rem;
		line-height: 1.4;
		color: var(--pico-color, #374151);
	}

	.no-steps {
		text-align: center;
		padding: 2rem;
		color: var(--pico-muted-color, #6b7280);
		font-style: italic;
	}

	@media (max-width: 768px) {
		.controls-header {
			flex-direction: column;
			gap: 0.75rem;
			align-items: stretch;
		}

		.speed-selector {
			justify-content: space-between;
		}

		.control-buttons {
			flex-wrap: wrap;
			gap: 0.3rem;
		}

		.control-buttons button {
			min-width: 2.25rem;
			height: 2.25rem;
		}

		.animation-controls {
			padding: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.control-buttons button {
			min-width: 2rem;
			height: 2rem;
		}

		.current-step {
			padding: 0.75rem;
		}

		.step-list summary {
			padding: 0.5rem;
		}

		.step-item {
			padding: 0.5rem;
		}
	}
</style>
