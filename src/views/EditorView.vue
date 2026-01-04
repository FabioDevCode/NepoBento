<script setup lang="ts">
import ProfileColumn from '@/components/layout/ProfileColumn.vue';
import FloatingToolbar from '@/components/layout/FloatingToolbar.vue';
import EditorGrid from '@/components/editor/EditorGrid.vue';
</script>

<template>
  <div class="min-h-screen bg-[#F9FAFB] flex p-2">
    <!-- Colonne gauche - Profil fixe -->
    <ProfileColumn />
    <!-- Zone principale - Grille de blocs éditables -->
    <main class="flex-2 min-h-screen p-2">
      <EditorGrid />
    </main>
    <!-- Barre d'outils flottante -->
    <FloatingToolbar />
  </div>
</template>
