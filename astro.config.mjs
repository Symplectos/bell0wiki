import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
// latex support
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';

// https://astro.build/config
export default defineConfig({
	site: 'https://bell0bytes.eu',
	base: './',
	integrations: [
		starlight({
			customCss: [
				'./src/styles/bell0bytes.css',
				'./src/styles/bell0bytesDark.css',
				'./src/styles/bell0bytesLight.css'
			],
			favicon: '/favicon.ico',
			title: 'bell0bytes',
			social: {
				codeberg: 'https://codeberg.org/symplectos',
				gitlab: 'https://gitlab.com/symplectos',
				github: 'https://github.com/symplectos'
			},
			sidebar: [
				{
					label: 'Game Development',
					collapsed: false,
					autogenerate: {directory: 'gamedev'},
				},
				{
					label: 'Mathematics',
					collapsed: false,
					autogenerate: { directory: 'mathematics' },
				},
				{
					label: 'History, Lore & Mythology',
					collapsed: false,
					autogenerate: { directory: 'lore' },
				},
			],
			editLink: {
				baseUrl: 'https://gitlab.com/symplectos/bell0wiki/-/edit/main/'
			}
		}),
	],
	markdown: {
		remarkPlugins: [remarkMath],
    	rehypePlugins: [rehypeMathjax],
	}
});