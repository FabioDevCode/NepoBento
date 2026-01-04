<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Block } from '@/types';
import { useBentoStore } from '@/stores/bento';
import { X, User, Link, Share2, Type, Image as ImageIcon } from 'lucide-vue-next';

const store = useBentoStore();

const block = computed(() => store.selectedBlock);
const isOpen = computed(() => !!block.value);

// Copie locale pour l'édition
const editContent = ref<Block['content']>({});
const editSize = ref({ width: 1, height: 1 });

watch(block, (newBlock) => {
    if (newBlock) {
		editContent.value = { ...newBlock.content };
		editSize.value = { ...newBlock.size };
    }
}, {
	immediate: true
});

function saveChanges() {
    if (block.value) {
		store.updateBlock(block.value.id, {
			content: { ...editContent.value },
			size: { ...editSize.value },
		});
    }
}

function close() {
  	store.clearSelection();
}

const blockTypeIcons = {
	profile: User,
	link: Link,
	social: Share2,
	text: Type,
	image: ImageIcon,
};

const socialPlatforms = [
	{ value: 'twitter', label: 'Twitter / X' },
	{ value: 'instagram', label: 'Instagram' },
	{ value: 'linkedin', label: 'LinkedIn' },
	{ value: 'github', label: 'GitHub' },
	{ value: 'youtube', label: 'YouTube' },
	{ value: 'tiktok', label: 'TikTok' },
	{ value: 'facebook', label: 'Facebook' },
	{ value: 'other', label: 'Autre' },
];
</script>

<template>
  	<Transition name="slide">
		<div
		v-if="isOpen && block"
		class="fixed right-0 top-0 h-full w-full bg-gray-900 border-l border-white/10 shadow-xl z-50 overflow-y-auto"
		>
			<!-- Header -->
			<div class="sticky top-0 bg-gray-900 border-b border-white/10 p-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<component :is="blockTypeIcons[block.type]" class="w-5 h-5" />
					<span class="font-semibold capitalize">{{ block.type }}</span>
				</div>
				<button
					@click="close"
					class="p-1.5 rounded-md hover:bg-white/10 transition-colors"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

		<!-- Content -->
		<div class="p-4 space-y-6">
			<!-- Taille -->
			<div>
			<h4 class="text-sm font-medium text-white/60 mb-3">Taille</h4>
			<div class="grid grid-cols-2 gap-3">
				<div>
				<label class="text-xs text-white/40 block mb-1">Largeur</label>
				<input 
					type="number" 
					v-model.number="editSize.width"
					min="1" 
					max="4"
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
					@change="saveChanges"
				/>
				</div>
				<div>
				<label class="text-xs text-white/40 block mb-1">Hauteur</label>
				<input 
					type="number" 
					v-model.number="editSize.height"
					min="1" 
					max="4"
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
					@change="saveChanges"
				/>
				</div>
			</div>
			</div>

			<!-- Contenu selon le type -->
			<div>
			<h4 class="text-sm font-medium text-white/60 mb-3">Contenu</h4>
			
			<!-- Profile -->
			<template v-if="block.type === 'profile'">
				<div class="space-y-3">
				<div>
					<label class="text-xs text-white/40 block mb-1">Nom</label>
					<input 
					type="text" 
					v-model="editContent.name"
					placeholder="Votre nom"
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
					@input="saveChanges"
					/>
				</div>
				<div>
					<label class="text-xs text-white/40 block mb-1">Bio</label>
					<textarea 
					v-model="editContent.bio"
					placeholder="Une courte bio..."
					rows="3"
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm resize-none"
					@input="saveChanges"
					/>
				</div>
				<div>
					<label class="text-xs text-white/40 block mb-1">URL Avatar</label>
					<input 
					type="url" 
					v-model="editContent.avatar"
					placeholder="https://..."
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
					@input="saveChanges"
					/>
				</div>
				</div>
			</template>

			<!-- Link -->
			<template v-else-if="block.type === 'link'">
				<div class="space-y-3">
				<div>
					<label class="text-xs text-white/40 block mb-1">Titre</label>
					<input 
					type="text" 
					v-model="editContent.title"
					placeholder="Mon lien"
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
					@input="saveChanges"
					/>
				</div>
				<div>
					<label class="text-xs text-white/40 block mb-1">URL</label>
					<input 
					type="url" 
					v-model="editContent.url"
					placeholder="https://..."
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
					@input="saveChanges"
					/>
				</div>
				</div>
			</template>

			<!-- Social -->
			<template v-else-if="block.type === 'social'">
				<div class="space-y-3">
				<div>
					<label class="text-xs text-white/40 block mb-1">Plateforme</label>
					<select 
					v-model="editContent.platform"
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
					@change="saveChanges"
					>
					<option v-for="p in socialPlatforms" :key="p.value" :value="p.value">
						{{ p.label }}
					</option>
					</select>
				</div>
				<div>
					<label class="text-xs text-white/40 block mb-1">Nom d'utilisateur</label>
					<input 
					type="text" 
					v-model="editContent.username"
					placeholder="@username"
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
					@input="saveChanges"
					/>
				</div>
				<div>
					<label class="text-xs text-white/40 block mb-1">URL du profil</label>
					<input 
					type="url" 
					v-model="editContent.url"
					placeholder="https://..."
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
					@input="saveChanges"
					/>
				</div>
				</div>
			</template>

			<!-- Text -->
			<template v-else-if="block.type === 'text'">
				<div class="space-y-3">
				<div>
					<label class="text-xs text-white/40 block mb-1">Titre</label>
					<input 
					type="text" 
					v-model="editContent.title"
					placeholder="Titre"
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
					@input="saveChanges"
					/>
				</div>
				<div>
					<label class="text-xs text-white/40 block mb-1">Texte</label>
					<textarea 
					v-model="editContent.text"
					placeholder="Votre texte..."
					rows="5"
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm resize-none"
					@input="saveChanges"
					/>
				</div>
				</div>
			</template>

			<!-- Image -->
			<template v-else-if="block.type === 'image'">
				<div class="space-y-3">
				<div>
					<label class="text-xs text-white/40 block mb-1">URL de l'image</label>
					<input 
					type="url" 
					v-model="editContent.src"
					placeholder="https://..."
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
					@input="saveChanges"
					/>
				</div>
				<div>
					<label class="text-xs text-white/40 block mb-1">Texte alternatif</label>
					<input 
					type="text" 
					v-model="editContent.alt"
					placeholder="Description de l'image"
					class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
					@input="saveChanges"
					/>
				</div>
				</div>
			</template>
			</div>

			<!-- Actions -->
			<div class="pt-4 border-t border-white/10 space-y-2">
			<button 
				@click="store.duplicateBlock(block.id)"
				class="w-full px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
			>
				Dupliquer le bloc
			</button>
			<button 
				@click="store.deleteBlock(block.id)"
				class="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
			>
				Supprimer le bloc
			</button>
			</div>
		</div>
		</div>
	</Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
