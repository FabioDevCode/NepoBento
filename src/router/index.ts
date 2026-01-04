import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		redirect: '/editor',
	},
	{
		path: '/editor',
		name: 'Editor',
		component: () => import('@/views/EditorView.vue'),
		meta: {
			title: 'Nepo Bento - Éditeur',
		},
	},
	{
		path: '/preview',
		name: 'Preview',
		component: () => import('@/views/PreviewView.vue'),
		meta: {
			title: 'Nepo Bento - Aperçu',
		},
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

// Mise à jour du titre de la page
router.beforeEach((to, _from, next) => {
	document.title = (to.meta.title as string) || 'NepoBento';
	next();
});

export default router;
