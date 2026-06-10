import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';
import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';

const BASE_URL = 'https://api-postcards.designmodo.com/api/v1';

export class Postcards implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Postcards',
		name: 'postcards',
		icon: 'file:postcards.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Postcards Email Builder by Designmodo — list projects/folders and export email designs',
		defaults: { name: 'Postcards' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'postcardsApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Folder', value: 'folder' },
					{ name: 'Project', value: 'project' },
					{ name: 'Usage', value: 'usage' },
				],
				default: 'project',
			},

			// Project operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['project'] } },
				options: [
					{ name: 'Export', value: 'export', action: 'Export a project', description: 'Export a project to HTML or ZIP' },
					{ name: 'Get', value: 'get', action: 'Get a project', description: 'Get one project by ID' },
					{ name: 'List', value: 'list', action: 'List projects', description: 'List projects in the team' },
				],
				default: 'list',
			},
			// Folder operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['folder'] } },
				options: [
					{ name: 'Get', value: 'get', action: 'Get a folder', description: 'Get a folder and its projects' },
					{ name: 'List', value: 'list', action: 'List folders', description: 'List all folders in the team' },
				],
				default: 'list',
			},
			// Usage operation
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['usage'] } },
				options: [
					{ name: 'Get', value: 'get', action: 'Get usage', description: 'Get export quota and active plan' },
				],
				default: 'get',
			},

			// IDs
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'string',
				default: '',
				required: true,
				description: 'Numeric ID (e.g. 305876) or obfuscated_id (e.g. 32b3f40e).',
				displayOptions: { show: { resource: ['project'], operation: ['get', 'export'] } },
			},
			{
				displayName: 'Folder ID',
				name: 'folderId',
				type: 'string',
				default: '',
				required: true,
				description: 'Numeric ID or obfuscated_id',
				displayOptions: { show: { resource: ['folder'], operation: ['get'] } },
			},
			{
				displayName: 'Folder ID (Filter)',
				name: 'folderFilter',
				type: 'string',
				default: '',
				description: 'Filter by folder (numeric ID or obfuscated_id). Leave empty for all projects.',
				displayOptions: { show: { resource: ['project'], operation: ['list'] } },
			},

			// Pagination (list + folder get)
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				displayOptions: {
					show: {
						resource: ['project', 'folder'],
						operation: ['list', 'get'],
					},
					hide: { resource: ['project'], operation: ['get'] },
				},
			},
			{
				displayName: 'Per Page',
				name: 'perPage',
				type: 'number',
				default: 50,
				description: 'Items per page (max 100)',
				displayOptions: {
					show: {
						resource: ['project', 'folder'],
						operation: ['list', 'get'],
					},
					hide: { resource: ['project'], operation: ['get'] },
				},
			},

			// Export options
			{
				displayName: 'Image Hosting',
				name: 'imageHosting',
				type: 'boolean',
				default: false,
				description: 'Whether to upload assets to Postcards hosting and reference them by URL. If off, returns a ZIP.',
				displayOptions: { show: { resource: ['project'], operation: ['export'] } },
			},
			{
				displayName: 'Use CDN',
				name: 'cdn',
				type: 'boolean',
				default: false,
				description: 'Whether to serve assets from the Postcards CDN. Requires Image Hosting and the Pro plan.',
				displayOptions: { show: { resource: ['project'], operation: ['export'] } },
			},
			{
				displayName: 'Minify HTML',
				name: 'minify',
				type: 'boolean',
				default: false,
				displayOptions: { show: { resource: ['project'], operation: ['export'] } },
			},
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				default: 'json',
				description: 'Response shape when Image Hosting is on (ignored for ZIP)',
				options: [
					{ name: 'HTML', value: 'html' },
					{ name: 'JSON', value: 'json' },
				],
				displayOptions: { show: { resource: ['project'], operation: ['export'], imageHosting: [true] } },
			},
			{
				displayName: 'Variables',
				name: 'variables',
				type: 'json',
				default: '{}',
				description: 'Map of {{key}} placeholder substitutions. Values must be scalar.',
				displayOptions: { show: { resource: ['project'], operation: ['export'] } },
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property to store the ZIP in (export without Image Hosting)',
				displayOptions: { show: { resource: ['project'], operation: ['export'], imageHosting: [false] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let method: IHttpRequestMethods = 'GET';
				let url = '';
				const qs: IDataObject = {};
				let body: IDataObject | undefined;

				if (resource === 'project' && operation === 'list') {
					url = `${BASE_URL}/projects`;
					const folderFilter = this.getNodeParameter('folderFilter', i, '') as string;
					if (folderFilter) qs.folder_id = folderFilter;
					qs.page = this.getNodeParameter('page', i, 1);
					qs.per_page = this.getNodeParameter('perPage', i, 50);
				} else if (resource === 'project' && operation === 'get') {
					url = `${BASE_URL}/projects/${this.getNodeParameter('projectId', i)}`;
				} else if (resource === 'project' && operation === 'export') {
					method = 'POST';
					const projectId = this.getNodeParameter('projectId', i) as string;
					url = `${BASE_URL}/projects/${projectId}/export`;
					const imageHosting = this.getNodeParameter('imageHosting', i, false) as boolean;
					let variables: IDataObject = {};
					const rawVars = this.getNodeParameter('variables', i, {}) as unknown;
					variables = typeof rawVars === 'string' ? JSON.parse(rawVars || '{}') : (rawVars as IDataObject);
					body = {
						imageHosting,
						cdn: this.getNodeParameter('cdn', i, false),
						minify: this.getNodeParameter('minify', i, false),
						format: imageHosting ? this.getNodeParameter('format', i, 'json') : 'json',
						variables,
					};

					if (!imageHosting) {
						// ZIP — binary response
						const buffer = (await this.helpers.httpRequestWithAuthentication.call(this, 'postcardsApi', {
							method,
							url,
							body: JSON.stringify(body),
							headers: { 'Content-Type': 'application/json' },
							json: false,
							encoding: 'arraybuffer',
						})) as Buffer;
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;
						const binaryData = await this.helpers.prepareBinaryData(
							Buffer.from(buffer),
							`${projectId}.zip`,
							'application/zip',
						);
						returnData.push({
							json: { format: 'zip', projectId },
							binary: { [binaryPropertyName]: binaryData },
							pairedItem: { item: i },
						});
						continue;
					}
				} else if (resource === 'folder' && operation === 'list') {
					url = `${BASE_URL}/folders`;
					qs.page = this.getNodeParameter('page', i, 1);
					qs.per_page = this.getNodeParameter('perPage', i, 50);
				} else if (resource === 'folder' && operation === 'get') {
					url = `${BASE_URL}/folders/${this.getNodeParameter('folderId', i)}`;
					qs.page = this.getNodeParameter('page', i, 1);
					qs.per_page = this.getNodeParameter('perPage', i, 50);
				} else if (resource === 'usage') {
					url = `${BASE_URL}/usage`;
				}

				const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'postcardsApi', {
					method,
					url,
					qs,
					body,
					json: true,
				})) as IDataObject;

				returnData.push({ json: response, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
