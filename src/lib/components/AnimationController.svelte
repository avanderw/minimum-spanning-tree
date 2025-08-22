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
		background: var(--card-background-color);
		border: 1px solid var(--muted-border-color);
		border-radius: 8px;
		padding: 1.5rem;
		margin: 1rem 0;
	}

	.controls-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.controls-header h3 {
		margin: 0;
	}

	.speed-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.speed-selector label {
		font-size: 0.9rem;
		font-weight: 500;
	}

	.speed-selector select {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.progress-section {
		margin-bottom: 1rem;
	}

	.progress-bar {
		margin-bottom: 0.5rem;
	}

	.progress-bar input[type="range"] {
		width: 100%;
	}

	.step-counter {
		text-align: center;
		font-size: 0.9rem;
		color: var(--muted-color);
	}

	.control-buttons {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		margin-bottom: 1.5rem;
	}

	.control-buttons button {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 2.5rem;
		height: 2.5rem;
		padding: 0.5rem;
		border-radius: 6px;
	}

	.current-step {
		background: var(--primary-background);
		border-left: 3px solid var(--primary);
		padding: 1rem;
		border-radius: 0 6px 6px 0;
		margin-bottom: 1rem;
	}

	.current-step h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.9rem;
		color: var(--primary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.current-step p {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.4;
	}

	.step-list {
		margin-top: 1rem;
	}

	.step-list summary {
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 4px;
		background: var(--secondary-background);
		font-weight: 500;
	}

	.step-list summary:hover {
		background: var(--muted-border-color);
	}

	.steps-container {
		max-height: 300px;
		overflow-y: auto;
		margin-top: 0.5rem;
		border: 1px solid var(--muted-border-color);
		border-radius: 4px;
	}

	.step-item {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem;
		border-bottom: 1px solid var(--muted-border-color);
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.step-item:hover {
		background: var(--secondary-background);
	}

	.step-item.active {
		background: var(--primary-background);
		border-left: 3px solid var(--primary);
	}

	.step-item:last-child {
		border-bottom: none;
	}

	.step-number {
		color: var(--muted-color);
		font-size: 0.85rem;
		font-weight: 500;
		flex-shrink: 0;
		min-width: 2rem;
	}

	.step-item.active .step-number {
		color: var(--primary);
		font-weight: 600;
	}

	.step-text {
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.no-steps {
		text-align: center;
		padding: 2rem;
		color: var(--muted-color);
		font-style: italic;
	}

	@media (max-width: 768px) {
		.controls-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.control-buttons {
			flex-wrap: wrap;
		}
	}
</style>
