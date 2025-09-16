<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { t, currentLanguage } from '$lib/i18n';
	import { availableLanguages } from '$lib/i18n/config.js';
	import BasicLayout from '$lib/BasicLayout.svelte';
	import { nip19 } from '@nostr/tools';
	import { SimplePool } from 'nostr-tools/pool';
	import { indexRelays } from '$lib/nostr';
	import { accent } from '$lib/store';

	interface Profile {
		npub: string;
		name?: string;
		picture?: string;
		nip05?: string;
	}

	const pool = new SimplePool();

	let selectedLanguage = 'en';
	let npubInput = '';
	let addedProfiles: Profile[] = [];
	let isLoading = false;
	let errorMessage = '';
	let generatedUrl = '';

	onMount(() => {
		selectedLanguage = $currentLanguage;
		document.documentElement.style.setProperty('--accent-color', '#' + $accent);

		return () => {
			pool.close([]);
		};
	});

	function isValidNpub(input: string): boolean {
		try {
			const decoded = nip19.decode(input);
			return decoded.type === 'npub';
		} catch {
			return false;
		}
	}

	function isValidNip05(input: string): boolean {
		const nip05Regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		return nip05Regex.test(input);
	}

	async function fetchProfile(npub: string): Promise<Profile | null> {
		try {
			const decoded = nip19.decode(npub);
			if (decoded.type !== 'npub') return null;

			const pubkey = decoded.data;

			const events = await pool.querySync(indexRelays, {
				kinds: [0],
				authors: [pubkey],
				limit: 1
			});

			if (events.length > 0) {
				const profile = JSON.parse(events[0].content);
				return {
					npub,
					name: profile.name || profile.display_name || npub.substring(0, 16) + '...',
					picture: profile.picture || '/icons/default-avatar.svg'
				};
			} else {
				// Return basic profile if not found
				return {
					npub,
					name: npub.substring(0, 16) + '...',
					picture: '/icons/default-avatar.svg'
				};
			}
		} catch (error) {
			console.error('Failed to fetch profile:', error);
			return {
				npub,
				name: npub.substring(0, 16) + '...',
				picture: '/icons/default-avatar.svg'
			};
		}
	}

	async function resolveNip05(nip05: string): Promise<string | null> {
		try {
			const [name, domain] = nip05.split('@');
			const url = `https://${domain}/.well-known/nostr.json?name=${name}`;

			const response = await fetch(url);
			if (!response.ok) return null;

			const data = await response.json();
			const pubkey = data.names?.[name];

			if (pubkey) {
				return nip19.npubEncode(pubkey);
			}
			return null;
		} catch (error) {
			console.error('Failed to resolve NIP-05:', error);
			return null;
		}
	}

	async function addNpub() {
		if (!npubInput.trim()) return;

		errorMessage = '';
		isLoading = true;

		try {
			let npubToAdd = npubInput.trim();

			// Handle NIP-05 addresses
			if (isValidNip05(npubInput.trim())) {
				const resolvedNpub = await resolveNip05(npubInput.trim());
				if (resolvedNpub) {
					const profile = await fetchProfile(resolvedNpub);
					if (profile) {
						profile.nip05 = npubInput.trim();
						// Check if already added
						if (!addedProfiles.some((p) => p.npub === profile.npub)) {
							addedProfiles = [...addedProfiles, profile];
						} else {
							errorMessage = 'This profile has already been added';
						}
					} else {
						errorMessage = 'Failed to fetch profile information';
					}
				} else {
					errorMessage = 'Could not resolve NIP-05 address';
				}
			} else if (isValidNpub(npubInput.trim())) {
				const profile = await fetchProfile(npubToAdd);
				if (profile) {
					// Check if already added
					if (!addedProfiles.some((p) => p.npub === profile.npub)) {
						addedProfiles = [...addedProfiles, profile];
					} else {
						errorMessage = 'This profile has already been added';
					}
				} else {
					errorMessage = 'Failed to fetch profile information';
				}
			} else {
				errorMessage = 'Please enter a valid npub or NIP-05 address';
			}
		} catch (error) {
			errorMessage = 'Invalid npub or NIP-05 address';
		} finally {
			isLoading = false;
			if (!errorMessage) {
				npubInput = '';
			}
		}
	}

	function removeProfile(index: number) {
		addedProfiles = addedProfiles.filter((_, i) => i !== index);
	}

	function generateUrl() {
		const baseUrl = `${$page.url.origin}/${selectedLanguage}`;

		if (addedProfiles.length === 0) {
			generatedUrl = baseUrl;
			return;
		}

		const npubList = addedProfiles.map((profile) => profile.npub).join(',');
		generatedUrl = `${baseUrl}?s=${npubList}`;
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(generatedUrl);
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			addNpub();
		}
	}
</script>

<svelte:head>
	<title>Create your Nstart personalized link</title>
</svelte:head>

<BasicLayout>
	<div slot="content" class="mx-auto w-full max-w-2xl">
		<div class="mb-8 animate-fade2 border-l-[0.9rem] border-accent pl-4">
			<h1 class="text-[2.5rem] font-bold leading-[1em] text-accent dark:text-accent sm:text-[3rem]">
				Create your Nstart link
			</h1>
		</div>
		<div class="mb-8 animate-fade1 text-[1.2rem] leading-7 text-neutral-700 dark:text-neutral-100">
			<p>
				With this wizard you can get a personalized Nstart link that allows other users to create an
				account, with some custom options and a personalized final following list
			</p>
		</div>

		<!-- Language Selection -->
		<div class="mb-6 animate-fade1">
			<label
				for="language-select"
				class="mb-2 block text-[1.1rem] font-medium text-neutral-700 dark:text-neutral-300"
			>
				Language
			</label>
			<select
				id="language-select"
				bind:value={selectedLanguage}
				class="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-[1.1rem] text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
			>
				{#each availableLanguages as language}
					<option value={language.code}>{language.name}</option>
				{/each}
			</select>
		</div>

		<!-- Npub Input -->
		<div class="mb-6 animate-fade1">
			<label
				for="npub-input"
				class="mb-2 block text-[1.1rem] font-medium text-neutral-700 dark:text-neutral-300"
			>
				Add npub or NIP-05 address
			</label>
			<div class="flex gap-2">
				<input
					id="npub-input"
					type="text"
					bind:value={npubInput}
					on:keypress={handleKeyPress}
					placeholder="npub1... or user@domain.com"
					class="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-3 text-[1.1rem] text-neutral-700 placeholder-neutral-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
				/>
				<button
					on:click={addNpub}
					disabled={isLoading || !npubInput.trim()}
					class="hover:bg-accent/90 rounded-md bg-accent px-6 py-3 text-[1.1rem] text-white transition-colors disabled:cursor-not-allowed disabled:bg-neutral-400"
				>
					{isLoading ? 'Adding...' : 'Add'}
				</button>
			</div>
			{#if errorMessage}
				<p class="mt-2 text-sm text-red-500">{errorMessage}</p>
			{/if}
		</div>

		<!-- Added Profiles List -->
		{#if addedProfiles.length > 0}
			<div class="mb-6 animate-fade1">
				<div class="mb-3 block text-[1.1rem] font-medium text-neutral-700 dark:text-neutral-300">
					Added profiles ({addedProfiles.length})
				</div>
				<div class="space-y-2">
					{#each addedProfiles as profile, index}
						<div
							class="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800"
						>
							<img
								src={profile.picture || '/icons/default-avatar.svg'}
								alt="Profile"
								class="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-600"
							/>
							<div class="min-w-0 flex-1">
								<div
									class="truncate text-[1rem] font-medium text-neutral-800 dark:text-neutral-200"
								>
									{profile.name || (profile.nip05 ? profile.nip05 : 'Unknown')}
								</div>
								<div class="truncate text-sm text-neutral-500 dark:text-neutral-400">
									{profile.nip05 ? profile.nip05 : profile.npub}
								</div>
							</div>
							<button
								on:click={() => removeProfile(index)}
								class="p-1 text-red-500 hover:text-red-700"
								title="Remove"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Generate Button -->
		<div class="mb-6 animate-fade1">
			<button
				on:click={generateUrl}
				class="hover:bg-accent/90 inline-flex w-full items-center justify-center rounded bg-accent px-8 py-4 text-[1.4rem] text-white transition-colors"
			>
				Create link
				<svg
					class="ml-2 h-5 w-5"
					viewBox="0 0 32 29"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fill="currentColor"
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M16.0695 1.17273C16.7448 0.497436 17.8397 0.497436 18.515 1.17273L30.6195 13.2773C31.2948 13.9526 31.2948 15.0475 30.6195 15.7228L18.515 27.8274C17.8397 28.5026 16.7448 28.5026 16.0695 27.8274C15.3942 27.1521 15.3942 26.0571 16.0695 25.3819L25.2221 16.2293H1.72922C0.774208 16.2293 0 15.4551 0 14.5001C0 13.545 0.774208 12.7708 1.72922 12.7708H25.2221L16.0695 3.61823C15.3942 2.94292 15.3942 1.84805 16.0695 1.17273Z"
					/>
				</svg>
			</button>
		</div>

		<!-- Generated URL -->
		{#if generatedUrl}
			<div class="mb-6 animate-fade1">
				<label
					for="generated-url"
					class="mb-2 block text-[1.1rem] font-medium text-neutral-700 dark:text-neutral-300"
				>
					Your personalized link
				</label>
				<div class="flex gap-2">
					<input
						id="generated-url"
						type="text"
						value={generatedUrl}
						readonly
						class="flex-1 select-all rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-[1rem] text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
					/>
					<button
						on:click={copyToClipboard}
						class="rounded-md bg-neutral-600 px-4 py-3 text-[1rem] text-white transition-colors hover:bg-neutral-700"
						title="Copy to clipboard"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					</button>
				</div>
			</div>
		{/if}
	</div>
</BasicLayout>
