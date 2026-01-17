<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue';
import type { Block } from '@/types';
import { VMap, VMapArcGisTileLayer } from 'vue-map-ui';
import { useBentoStore } from '@/stores/bento';
import 'leaflet/dist/leaflet.css';
import 'vue-map-ui/dist/style.css';

const props = defineProps<{ block: Block; }>();

const store = useBentoStore();

// Référence vers la carte
const mapRef = ref<InstanceType<typeof VMap> | null>(null);

// Coordonnées par défaut (Europe)
const defaultLat = 50;
const defaultLng = 10;

const center = computed(() => {
  const lat = (props.block.content as any).lat ?? defaultLat;
  const lng = (props.block.content as any).lng ?? defaultLng;
  return [lat, lng] as [number, number];
});

const zoom = computed(() => (props.block.content as any).zoom ?? 4);

// Sauvegarder la position et le zoom quand la carte change
function saveMapState(event: any) {
  const leafletMap = event.target;
  if (!leafletMap) return;

  const mapCenter = leafletMap.getCenter();
  const mapZoom = leafletMap.getZoom();

  // Mettre à jour directement le bloc dans le store
  const blockIndex = store.config.blocks.findIndex(b => b.id === props.block.id);
  if (blockIndex !== -1) {
    store.config.blocks[blockIndex] = {
      ...store.config.blocks[blockIndex],
      content: {
        lat: mapCenter.lat,
        lng: mapCenter.lng,
        zoom: mapZoom,
      },
    };
  }
}

// Forcer le recalcul de la taille de la carte après le montage
onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      if (mapRef.value) {
        const mapValue = (mapRef.value as any).map;
        const leafletMap = mapValue?.value || mapValue;
        if (leafletMap) {
          leafletMap.invalidateSize();
        }
      }
    }, 200);
  });
});
</script>

<template>
  <div class="map-container w-full h-full rounded-lg overflow-hidden">
    <VMap
      ref="mapRef"
      :center="center"
      :zoom="zoom"
      class="w-full h-full"
      style="min-height: 200px;"
      @moveend="saveMapState"
      @zoomend="saveMapState"
    >
      <VMapArcGisTileLayer />
    </VMap>
  </div>
</template>

<style>
/* Fix pour s'assurer que la carte prend toute la hauteur */
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  filter: grayscale(1);
}

.map-container .leaflet-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  filter: invert(1);
}

/* Fix pour les tuiles qui ne se chargent pas */
.leaflet-tile-pane {
  opacity: 1 !important;
}

.leaflet-tile {
  visibility: visible !important;
}
</style>
