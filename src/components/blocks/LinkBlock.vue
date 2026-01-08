<script setup lang="ts">
import { computed } from 'vue';
import type { Block } from '@/types';
import {
  Link,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  Youtube,
  Facebook,
  Twitch,
  Music2,
  AtSign,
  Globe
} from 'lucide-vue-next';

// Liste des réseaux sociaux connus avec leurs patterns de détection
const SOCIAL_PLATFORMS = [
  { name: 'twitter', patterns: ['twitter.com', 'x.com'], icon: Twitter },
  { name: 'instagram', patterns: ['instagram.com'], icon: Instagram },
  { name: 'linkedin', patterns: ['linkedin.com'], icon: Linkedin },
  { name: 'github', patterns: ['github.com'], icon: Github },
  { name: 'youtube', patterns: ['youtube.com', 'youtu.be'], icon: Youtube },
  { name: 'facebook', patterns: ['facebook.com', 'fb.com'], icon: Facebook },
  { name: 'twitch', patterns: ['twitch.tv'], icon: Twitch },
  { name: 'tiktok', patterns: ['tiktok.com'], icon: Music2 },
  { name: 'threads', patterns: ['threads.net'], icon: AtSign },
] as const;

const props = defineProps<{
    block: Block;
}>();

// Détecter si l'URL correspond à un réseau social
const detectedPlatform = computed(() => {
    const url = props.block.content.url?.toLowerCase() || '';
    if (!url) return null;

    for (const platform of SOCIAL_PLATFORMS) {
        if (platform.patterns.some(pattern => url.includes(pattern))) {
            return platform;
        }
    }
    return null;
});

// Icône à afficher (social détecté ou lien générique)
const displayIcon = computed(() => {
    return detectedPlatform.value?.icon || Link;
});

// Nom de la plateforme pour l'affichage
const platformName = computed(() => {
    return detectedPlatform.value?.name || null;
});

// Couleur de fond basée sur la plateforme
const iconBgClass = computed(() => {
    if (!detectedPlatform.value) return 'bg-gray-100';
    // On peut ajouter des couleurs spécifiques par plateforme si souhaité
    return 'bg-gray-100';
});
</script>

<template>
    <div class="flex items-center justify-start gap-3 h-full w-full p-3">
        <div :class="['w-10 h-10 shrink-0 rounded-xl flex items-center justify-center', iconBgClass]">
            <component :is="displayIcon" class="w-5 h-5 text-gray-700" />
        </div>
        <div class="flex flex-col min-w-0">
            <span class="font-medium text-gray-900 text-sm truncate">
                {{ block.content.title || 'Lien' }}
            </span>
            <span v-if="platformName" class="text-xs text-gray-500 capitalize">
                {{ platformName }}
            </span>
        </div>
    </div>
</template>
