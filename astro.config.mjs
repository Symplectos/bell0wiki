import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog'

// latex support
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';

// https://astro.build/config
export default defineConfig({
	site: 'https://bell0bytes.eu',
	base: './',
	integrations: [
		starlight({
			plugins: [starlightBlog({
				title: 'News',
				authors: {
					symplectos: {
						name: 'Gilles Bellot',
					}
				}
			})],
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
					collapsed: true,
					autogenerate: {directory: 'gamedev'},
				},
				{
					label: 'IT Infrastructure',
					collapsed: true,
					autogenerate: { directory: 'it' },
				},
				{
					label: 'Mathematics',
					collapsed: true,
					autogenerate: { directory: 'mathematics' },
				},
				{
					label: 'History, Lore & Mythology',
					collapsed: true,
					autogenerate: { directory: 'lore' },
				},
				{
					label: 'Politics & Society',
					collapsed: true,
					autogenerate: { directory: 'politics' },
				},
			],
		}),
	],
	markdown: {
		remarkPlugins: [remarkMath],
    	rehypePlugins: [rehypeMathjax],
	}
});