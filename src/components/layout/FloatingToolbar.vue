<script setup lang="ts">
import { ref } from 'vue';
import { useBentoStore } from '@/stores/bento';
import { useBentoStorage } from '@/composables';
import {
    Link,
    Type,
    Heading2,
    Image as ImageIcon,
    MapPin,
    Download,
    Upload,
    RotateCcw,
    Trash2,
    Check,
    AlertCircle
} from 'lucide-vue-next';
import type { BlockType } from '@/types';

const store = useBentoStore();
const { exportToFile, importFromFile, reset, error } = useBentoStorage();

const fileInput = ref<HTMLInputElement | null>(null);
const imageInput = ref<HTMLInputElement | null>(null);
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null);

const blockTypes: { type: BlockType; label: string; icon: typeof Link }[] = [
    { type: 'link', label: 'Lien', icon: Link },
    { type: 'title', label: 'Titre', icon: Heading2 },
    { type: 'text', label: 'Texte', icon: Type },
    { type: 'image', label: 'Image', icon: ImageIcon },
    { type: 'map', label: 'Carte', icon: MapPin },
];

function addBlock(type: BlockType) {
    // Cas spécial pour les images : ouvrir le sélecteur de fichier
    if (type === 'image') {
        imageInput.value?.click();
        return;
    }
    store.addBlock(type);
}

async function handleImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Vérifier que c'est bien une image
    if (!file.type.startsWith('image/')) {
        showNotification('error', 'Veuillez sélectionner une image valide');
        input.value = '';
        return;
    }

    // Limiter la taille (5 Mo max pour éviter les problèmes de localStorage)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification('error', 'L\'image est trop volumineuse (max 5 Mo)');
        input.value = '';
        return;
    }

    try {
        // Convertir l'image en base64
        const base64 = await fileToBase64(file);

        // Créer le bloc image avec la source base64 directement
        store.addBlockWithContent('image', {
            src: base64,
            alt: file.name.replace(/\.[^/.]+$/, '') // Nom sans extension
        });

        showNotification('success', 'Image ajoutée !');
        
        // Recharger la page pour afficher le bloc
        setTimeout(() => {
            window.location.reload();
        }, 300);
    } catch (err) {
        showNotification('error', 'Erreur lors du chargement de l\'image');
        console.error(err);
    }

    // Réinitialiser l'input
    input.value = '';
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function handleExport() {
    await exportToFile(`${store.metadata.title || 'bento'}.json`);
    showNotification('success', 'Configuration exportée !');
}

function triggerImport() {
    fileInput.value?.click();
}

async function handleImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
        const success = await importFromFile(file);
        if (success) {
            showNotification('success', 'Configuration importée !');
        } else {
            showNotification('error', error.value || 'Erreur lors de l\'import');
        }
    }
    input.value = '';
}

function handleReset() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser la configuration ?')) {
        reset();
        showNotification('success', 'Configuration réinitialisée !');
    }
}

function handleClearAll() {
    if (confirm('Êtes-vous sûr de vouloir tout supprimer (blocs et profil) ?')) {
        // Supprimer tous les blocs (copie du tableau pour éviter les problèmes de mutation)
        const blockIds = store.blocks.map(block => block.id);
        blockIds.forEach(id => {
            store.deleteBlock(id);
        });
        // Réinitialiser le profil
        store.resetProfile();
        showNotification('success', 'Tout a été supprimé !');
    }
}

function showNotification(type: 'success' | 'error', message: string) {
    notification.value = { type, message };
    setTimeout(() => {
        notification.value = null;
    }, 3000);
}
</script>

<template>
    <div class="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <!-- Barre d'outils principale -->
        <div id="toolbox" class="flex items-center justify-center gap-3 h-15 bg-white rounded-2xl shadow-lg border border-gray-100">
            <!-- Boutons d'ajout de blocs -->
            <div class="flex items-cente h-full gap-1">
                <button
                v-for="blockType in blockTypes"
                :key="blockType.type"
                @click="addBlock(blockType.type)"
                class="tooltip flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-150"
                :data-tooltip="blockType.label"
                >
                    <component :is="blockType.icon" class="w-4 h-4" />
                </button>
            </div>

            <!-- Séparateur -->
            <div class="w-px h-full bg-gray-200 mx-2" />

            <!-- Actions système -->
            <div id="actions" class="flex items-center gap-1">
                <input
                    ref="fileInput"
                    type="file"
                    accept=".json"
                    class="hidden"
                    @change="handleImport"
                />
                
                <input
                    ref="imageInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleImageSelect"
                />

                <button
                    @click="triggerImport"
                    class="tooltip flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-150"
                    data-tooltip="Importer"
                >
                    <Upload class="w-4 h-4" />
                </button>

                <button
                    @click="handleExport"
                    class="tooltip flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-150"
                    data-tooltip="Exporter"
                >
                    <Download class="w-4 h-4" />
                </button>

                <button
                    @click="handleReset"
                    class="tooltip flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-150"
                    data-tooltip="Réinitialiser"
                >
                    <RotateCcw class="w-4 h-4" />
                </button>

                <button
                    @click="handleClearAll"
                    class="tooltip flex items-center justify-center rounded-md hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all duration-150"
                    data-tooltip="Tout supprimer"
                >
                    <Trash2 class="w-4 h-4" />
                </button>
            </div>
        </div>

        <!-- Notification -->
        <Transition name="fade">
        <div 
            v-if="notification"
            class="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap shadow-lg"
            :class="{
            'bg-green-50 text-green-700 border border-green-200': notification.type === 'success',
            'bg-red-50 text-red-700 border border-red-200': notification.type === 'error',
            }"
        >
            <Check v-if="notification.type === 'success'" class="w-4 h-4" />
            <AlertCircle v-else class="w-4 h-4" />
            {{ notification.message }}
        </div>
        </Transition>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}

#toolbox {
    padding: 14px;
}

button {
    width: 32px;
    height: 32px;
}
</style>
