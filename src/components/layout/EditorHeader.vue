<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBentoStore } from '@/stores/bento';
import { useBentoStorage } from '@/composables';
import { 
  Eye, 
  Download, 
  Upload, 
  RotateCcw, 
  Palette,
  Settings,
  Check,
  AlertCircle
} from 'lucide-vue-next';

const router = useRouter();
const store = useBentoStore();
const { exportToFile, importFromFile, reset, error } = useBentoStorage();

const showThemePanel = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null);

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
  <header class="bg-gray-900 border-b border-white/10">
    <div class="container mx-auto px-4 h-16 flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <span class="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          NepoBento
        </span>
        <span class="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/60">
          Éditeur
        </span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <input 
          ref="fileInput"
          type="file" 
          accept=".json"
          class="hidden"
          @change="handleImport"
        />

        <button 
          @click="triggerImport"
          class="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
          title="Importer"
        >
          <Upload class="w-4 h-4" />
          <span class="hidden sm:inline">Importer</span>
        </button>

        <button 
          @click="handleExport"
          class="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
          title="Exporter"
        >
          <Download class="w-4 h-4" />
          <span class="hidden sm:inline">Exporter</span>
        </button>

        <button 
          @click="handleReset"
          class="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
          title="Réinitialiser"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <div class="w-px h-6 bg-white/10 mx-2" />

        <button 
          @click="goToPreview"
          class="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
        >
          <Eye class="w-4 h-4" />
          <span>Aperçu</span>
        </button>
      </div>
    </div>

    <!-- Notification -->
    <Transition name="fade">
      <div 
        v-if="notification"
        class="fixed top-20 right-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm z-50"
        :class="{
          'bg-green-500/20 text-green-400 border border-green-500/30': notification.type === 'success',
          'bg-red-500/20 text-red-400 border border-red-500/30': notification.type === 'error',
        }"
      >
        <Check v-if="notification.type === 'success'" class="w-4 h-4" />
        <AlertCircle v-else class="w-4 h-4" />
        {{ notification.message }}
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
