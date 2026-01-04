<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBentoStore } from '@/stores/bento';
import { User, Camera } from 'lucide-vue-next';

const store = useBentoStore();

const isEditingName = ref(false);
const isEditingBio = ref(false);
const nameInput = ref<HTMLInputElement | null>(null);
const bioInput = ref<HTMLTextAreaElement | null>(null);

const profile = computed(() => store.profile);

function startEditingName() {
    isEditingName.value = true;
    setTimeout(() => nameInput.value?.focus(), 0);
}

function startEditingBio() {
    isEditingBio.value = true;
    setTimeout(() => bioInput.value?.focus(), 0);
}

function saveName(event: Event) {
    const target = event.target as HTMLInputElement;
    store.updateProfile({ name: target.value || 'Votre Nom' });
    isEditingName.value = false;
}

function saveBio(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    store.updateProfile({ bio: target.value });
    isEditingBio.value = false;
}

function handleAvatarUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            store.updateProfile({ avatar: result });
        };
        reader.readAsDataURL(file);
    }
}
</script>

<template>
    <aside class="profile-column w-full shrink-0 flex flex-col h-full flex-1 min-h-screen">
        <!-- Contenu du profil -->
        <div class="flex-1">
            <!-- Avatar -->
            <div id="avatar" class="relative w-48 h-48">
                <div
                    v-if="profile.avatar"
                    class="w-full h-full rounded-full bg-cover bg-center border-2 border-white shadow-sm"
                    :style="{ backgroundImage: `url(${profile.avatar})` }"
                />
                <div
                    v-else
                    class="w-full h-full rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm"
                >
                    <User class="w-10 h-10 text-gray-400" />
                </div>

                <!-- Bouton upload avatar -->
                <label
                    class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                >
                    <Camera class="w-6 h-6 text-white" />
                    <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        @change="handleAvatarUpload"
                    />
                </label>
            </div>

            <!-- Nom -->
            <div id="nom" class="text-start mb-3">
                <input
                    v-if="isEditingName"
                    ref="nameInput"
                    type="text"
                    :value="profile.name"
                    class="w-full text-center text-xl font-semibold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none px-2 py-1"
                    @blur="saveName"
                    @keydown.enter="($event.target as HTMLInputElement).blur()"
                />
                <h1
                v-else
                class="text-4xl font-extrabold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors px-2 py-1"
                @click="startEditingName"
                >
                {{ profile.name }}
                </h1>
            </div>

            <!-- Bio -->
            <div class="text-start">
                <textarea
                    v-if="isEditingBio"
                    ref="bioInput"
                    :value="profile.bio"
                    rows="3"
                    class="w-full text-start text-md text-gray-600 bg-transparent border border-blue-500 rounded-lg focus:outline-none resize-none px-3 py-2"
                    @blur="saveBio"
                />
                <p
                    v-else
                    class="text-md text-gray-600 cursor-pointer hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                    @click="startEditingBio"
                >
                {{ profile.bio || 'Cliquez pour ajouter une bio...' }}
                </p>
            </div>
        </div>

        <!-- Footer avec nom de l'app -->
        <div class="p-4 h-16">
            <div class="text-start">
                <span class="text-xs text-gray-400 font-medium tracking-wide">
                    Nepo Bento
                </span>
            </div>
        </div>
  </aside>
</template>

<style scoped>
.profile-column {
    background-color: transparent;
    padding: 60px 60px 0px 60px;
}

#avatar {
    margin-bottom: 40px;
}

#nom {
    margin-bottom: 20px;
}

</style>
