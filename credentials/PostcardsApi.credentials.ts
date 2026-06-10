import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PostcardsApi implements ICredentialType {
	name = 'postcardsApi';

	displayName = 'Postcards API';

	icon: Icon = 'file:postcards.svg';

	documentationUrl = 'https://help.designmodo.com/article/537-api-getting-started';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Postcards API key (format sk-pcds-api03-...). Create it in Postcards workspace settings → API Keys.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api-postcards.designmodo.com',
			url: '/api/v1/usage',
			method: 'GET',
		},
	};
}
