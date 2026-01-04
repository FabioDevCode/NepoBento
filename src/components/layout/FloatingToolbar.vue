<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBentoStore } from '@/stores/bento';
import { useBentoStorage } from '@/composables';
import { 
  Link, 
  Share2, 
  Type, 
  Image as ImageIcon,
  Download,
  Upload,
  Eye,
  RotateCcw,
  Check,
  AlertCircle
} from 'lucide-vue-next';
import type { BlockType } from '@/types';

const router = useRouter();
const store = useBentoStore();
const { exportToFile, importFromFile, reset, error } = useBentoStorage();

const fileInput = ref<HTMLInputElement | null>(null);
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null);

const blockTypes: { type: BlockType; label: string; icon: typeof Link }[] = [
  { type: 'link', label: 'Lien', icon: Link },
  { type: 'social', label: 'Social', icon: Share2 },
  { type: 'text', label: 'Texte', icon: Type },
  { type: 'image', label: 'Image', icon: ImageIcon },
];

function addBlock(type: BlockType) {
  store.addBlock(type);
}

function goToPreview() {
  router.push('/preview');
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

function showNotification(type: 'success' | 'error', message: string) {
  notification.value = { type, message };
  setTimeout(() => {
    notification.value = null;
  }, 3000);
}
</script>

<template>
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
    <!-- Barre d'outils principale -->
    <div class="flex items-center gap-1 px-3 py-2 bg-white rounded-2xl shadow-lg border border-gray-100">
      <!-- Boutons d'ajout de blocs -->
      <div class="flex items-center gap-1">
        <button 
          v-for="blockType in blockTypes" 
          :key="blockType.type"
          @click="addBlock(blockType.type)"
          class="tooltip p-3 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-150"
          :data-tooltip="blockType.label"
        >
          <component :is="blockType.icon" class="w-5 h-5" />
        </button>
      </div>

      <!-- Séparateur -->
      <div class="w-px h-8 bg-gray-200 mx-2" />

      <!-- Actions système -->
      <div class="flex items-center gap-1">
        <input 
          ref="fileInput"
          type="file" 
          accept=".json"
          class="hidden"
          @change="handleImport"
        />

        <button 
          @click="triggerImport"
          class="tooltip p-3 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-150"
          data-tooltip="Importer"
        >
          <Upload class="w-5 h-5" />
        </button>

        <button 
          @click="handleExport"
          class="tooltip p-3 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-150"
          data-tooltip="Exporter"
        >
          <Download class="w-5 h-5" />
        </button>

        <button 
          @click="handleReset"
          class="tooltip p-3 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-150"
          data-tooltip="Réinitialiser"
        >
          <RotateCcw class="w-5 h-5" />
        </button>

        <!-- Séparateur -->
        <div class="w-px h-8 bg-gray-200 mx-2" />

        <button 
          @click="goToPreview"
          class="tooltip p-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition-all duration-150"
          data-tooltip="Aperçu"
        >
          <Eye class="w-5 h-5" />
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
</style>
