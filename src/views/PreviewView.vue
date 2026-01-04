<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBentoStore } from '@/stores/bento';
import BentoBlock from '@/components/blocks/BentoBlock.vue';
import { ArrowLeft, User } from 'lucide-vue-next';

const router = useRouter();
const store = useBentoStore();

function goToEditor() {
    router.push('/editor');
}

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${store.grid.columns}, 1fr)`,
  gap: `${store.grid.gap}px`,
  gridAutoRows: `${store.grid.rowHeight}px`,
}));
</script>

<template>
  <div class="min-h-screen bg-[#F9FAFB]">
    <!-- Header flottant -->
    <div class="fixed top-4 left-4 right-4 z-50 flex justify-between items-center">
      <button 
        @click="goToEditor"
        class="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 shadow-sm border border-gray-200 rounded-xl text-sm transition-colors text-gray-700"
      >
        <ArrowLeft class="w-4 h-4" />
        Retour à l'éditeur
      </button>

      <div class="px-4 py-2 bg-white shadow-sm border border-gray-200 rounded-xl text-sm text-gray-500">
        Mode aperçu
      </div>
    </div>

    <!-- Layout 3 colonnes comme l'éditeur -->
    <div class="min-h-screen flex pt-16">
      <!-- Colonne gauche - Profil -->
      <aside class="w-72 shrink-0 p-6">
        <div class="text-center">
          <!-- Avatar -->
          <div class="w-24 h-24 mx-auto mb-6">
            <div
              v-if="store.profile.avatar"
              class="w-full h-full rounded-full bg-cover bg-center border-2 border-white shadow-sm"
              :style="{ backgroundImage: `url(${store.profile.avatar})` }"
            />
            <div
              v-else
              class="w-full h-full rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm"
            >
              <User class="w-10 h-10 text-gray-400" />
            </div>
          </div>

          <!-- Nom -->
          <h2 class="text-xl font-semibold text-gray-900 mb-2">
            {{ store.profile.name }}
          </h2>

          <!-- Bio -->
          <p class="text-sm text-gray-600">
            {{ store.profile.bio }}
          </p>
        </div>

        <!-- Footer -->
        <div class="mt-auto pt-8 text-center">
          <span class="text-xs text-gray-400 font-medium tracking-wide">
            NepoBento
          </span>
        </div>
      </aside>

      <!-- Zone principale - Grille de blocs -->
      <main class="flex-1 p-6">
        <div v-if="store.blocks.length > 0" :style="gridStyle">
          <BentoBlock 
            v-for="block in store.blocks" 
            :key="block.id"
            :block="block"
            :is-preview="true"
          />
        </div>

        <!-- État vide -->
        <div
          v-else
          class="h-full flex flex-col items-center justify-center text-center py-20"
        >
          <p class="text-gray-500">
            Aucun bloc à afficher.
          </p>
        </div>
      </main>
    </div>
  </div>
</template>
