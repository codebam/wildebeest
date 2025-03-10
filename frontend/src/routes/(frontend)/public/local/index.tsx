import { $, component$ } from '@builder.io/qwik'
import { getDatabase } from 'wildebeest/backend/src/database'
import { MastodonStatus } from '~/types'
import * as timelines from 'wildebeest/functions/api/v1/timelines/public'
import { DocumentHead, loader$ } from '@builder.io/qwik-city'
import StickyHeader from '~/components/StickyHeader/StickyHeader'
import { getDocumentHead } from '~/utils/getDocumentHead'
import { StatusesPanel } from '~/components/StatusesPanel/StatusesPanel'
import { getErrorHtml } from '~/utils/getErrorHtml/getErrorHtml'

export const statusesLoader = loader$<Promise<MastodonStatus[]>>(async ({ platform, html }) => {
	try {
		// TODO: use the "trending" API endpoint here.
		const response = await timelines.handleRequest(platform.domain, await getDatabase(platform), { local: true })
		const results = await response.text()
		// Manually parse the JSON to ensure that Qwik finds the resulting objects serializable.
		return JSON.parse(results) as MastodonStatus[]
	} catch (e: unknown) {
		const error = e as { stack: string; cause: string }
		console.warn(error.stack, error.cause)
		throw html(500, getErrorHtml('The local timeline is unavailable'))
	}
})

export default component$(() => {
	const statuses = statusesLoader().value
	return (
		<>
			<StickyHeader>
				<div class="xl:rounded-t bg-wildebeest-700 p-4 flex items-center">
					<i style={{ width: '1.25rem', height: '1rem' }} class="fa fa-users fa-fw mr-3 w-5 h-4" />
					<span>Local timeline</span>
				</div>
			</StickyHeader>
		</>
	)
})

export const requestLoader = loader$(async ({ request }) => {
	// Manually parse the JSON to ensure that Qwik finds the resulting objects serializable.
	return JSON.parse(JSON.stringify(request)) as Request
})

export const head: DocumentHead = ({ resolveValue }) => {
	const { url } = resolveValue(requestLoader)
	return getDocumentHead({
		title: 'Local timeline - Wildebeest',
		og: {
			url,
		},
	})
}
