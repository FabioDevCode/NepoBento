import { ref } from 'vue';
import { useBentoStore } from '@/stores/bento';

export function useBentoStorage() {
  const store = useBentoStore();
  const isExporting = ref(false);
  const isImporting = ref(false);
  const error = ref<string | null>(null);

  // Export vers fichier JSON
  async function exportToFile(filename?: string): Promise<void> {
    isExporting.value = true;
    error.value = null;
    
    try {
      const json = store.exportConfig();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `bento-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      error.value = 'Erreur lors de l\'export';
      console.error(e);
    } finally {
      isExporting.value = false;
    }
  }

  // Import depuis fichier JSON
  async function importFromFile(file: File): Promise<boolean> {
    isImporting.value = true;
    error.value = null;
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const success = store.importConfig(content);
          if (!success) {
            error.value = 'Fichier de configuration invalide';
          }
          resolve(success);
        } catch (e) {
          error.value = 'Erreur lors de la lecture du fichier';
          console.error(e);
          resolve(false);
        } finally {
          isImporting.value = false;
        }
      };
      
      reader.onerror = () => {
        error.value = 'Erreur lors de la lecture du fichier';
        isImporting.value = false;
        resolve(false);
      };
      
      reader.readAsText(file);
    });
  }

  // Copier la configuration dans le presse-papiers
  async function copyToClipboard(): Promise<boolean> {
    try {
      const json = store.exportConfig();
      await navigator.clipboard.writeText(json);
      return true;
    } catch (e) {
      error.value = 'Erreur lors de la copie';
      console.error(e);
      return false;
    }
  }

  // Importer depuis le presse-papiers
  async function importFromClipboard(): Promise<boolean> {
    try {
      const text = await navigator.clipboard.readText();
      return store.importConfig(text);
    } catch (e) {
      error.value = 'Erreur lors de l\'import depuis le presse-papiers';
      console.error(e);
      return false;
    }
  }

  // Réinitialiser la configuration
  function reset(): void {
    store.resetConfig();
    error.value = null;
  }

  return {
    isExporting,
    isImporting,
    error,
    exportToFile,
    importFromFile,
    copyToClipboard,
    importFromClipboard,
    reset,
  };
}
