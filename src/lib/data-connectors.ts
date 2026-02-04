// Data Connectors - Dataverse, Dynamics, Custom APIs

export interface DataRecord {
    id: string;
    [key: string]: unknown;
}

export interface DataConnector {
    name: string;
    id: string;
    connect(): Promise<boolean>;
    query(entity: string, filter?: string): Promise<DataRecord[]>;
    create(entity: string, data: Record<string, unknown>): Promise<string>;
    update(entity: string, id: string, data: Record<string, unknown>): Promise<boolean>;
    disconnect(): void;
}

// ============================================
// MICROSOFT DATAVERSE CONNECTOR
// ============================================
export class DataverseConnector implements DataConnector {
    name = 'Microsoft Dataverse';
    id = 'dataverse';
    private accessToken?: string;

    constructor(
        private config: {
            url: string;
            clientId: string;
            clientSecret: string;
            tenantId: string;
        }
    ) { }

    async connect(): Promise<boolean> {
        if (!this.config.url) {
            console.warn('Dataverse not configured');
            return false;
        }

        try {
            // OAuth2 token request
            const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    scope: `${this.config.url}/.default`,
                    grant_type: 'client_credentials',
                }),
            });
            const data = await response.json();
            this.accessToken = data.access_token;
            return !!this.accessToken;
        } catch (error) {
            console.error('Dataverse connection error:', error);
            return false;
        }
    }

    async query(entity: string, filter?: string): Promise<DataRecord[]> {
        if (!this.accessToken) return [];

        const url = `${this.config.url}/api/data/v9.2/${entity}${filter ? `?$filter=${filter}` : ''}`;
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });
        const data = await response.json();
        return data.value || [];
    }

    async create(entity: string, data: Record<string, unknown>): Promise<string> {
        if (!this.accessToken) return '';

        const url = `${this.config.url}/api/data/v9.2/${entity}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        const location = response.headers.get('OData-EntityId');
        return location?.match(/\(([^)]+)\)/)?.[1] || '';
    }

    async update(entity: string, id: string, data: Record<string, unknown>): Promise<boolean> {
        if (!this.accessToken) return false;

        const url = `${this.config.url}/api/data/v9.2/${entity}(${id})`;
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return response.ok;
    }

    disconnect(): void {
        this.accessToken = undefined;
    }
}

// ============================================
// DYNAMICS 365 CONNECTOR
// ============================================
export class DynamicsConnector implements DataConnector {
    name = 'Dynamics 365';
    id = 'dynamics';
    private accessToken?: string;

    constructor(
        private config: {
            url: string;
            clientId: string;
            clientSecret: string;
            tenantId: string;
        }
    ) { }

    async connect(): Promise<boolean> {
        if (!this.config.url) {
            console.warn('Dynamics not configured');
            return false;
        }

        try {
            const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    scope: `${this.config.url}/.default`,
                    grant_type: 'client_credentials',
                }),
            });
            const data = await response.json();
            this.accessToken = data.access_token;
            return !!this.accessToken;
        } catch (error) {
            console.error('Dynamics connection error:', error);
            return false;
        }
    }

    async query(entity: string, filter?: string): Promise<DataRecord[]> {
        if (!this.accessToken) return [];

        const url = `${this.config.url}/api/data/v9.2/${entity}${filter ? `?$filter=${filter}` : ''}`;
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });
        const data = await response.json();
        return data.value || [];
    }

    async create(entity: string, data: Record<string, unknown>): Promise<string> {
        if (!this.accessToken) return '';

        const url = `${this.config.url}/api/data/v9.2/${entity}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        const location = response.headers.get('OData-EntityId');
        return location?.match(/\(([^)]+)\)/)?.[1] || '';
    }

    async update(entity: string, id: string, data: Record<string, unknown>): Promise<boolean> {
        if (!this.accessToken) return false;

        const url = `${this.config.url}/api/data/v9.2/${entity}(${id})`;
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return response.ok;
    }

    disconnect(): void {
        this.accessToken = undefined;
    }
}

// ============================================
// CUSTOM REST CONNECTOR
// ============================================
export class CustomConnector implements DataConnector {
    name: string;
    id = 'custom';

    constructor(
        private config: {
            name: string;
            baseUrl: string;
            apiKey?: string;
            headers?: Record<string, string>;
        }
    ) {
        this.name = config.name;
    }

    async connect(): Promise<boolean> {
        return !!this.config.baseUrl;
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...this.config.headers,
        };
        if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        return headers;
    }

    async query(entity: string, filter?: string): Promise<DataRecord[]> {
        const url = `${this.config.baseUrl}/${entity}${filter ? `?${filter}` : ''}`;
        const response = await fetch(url, { headers: this.getHeaders() });
        return await response.json();
    }

    async create(entity: string, data: Record<string, unknown>): Promise<string> {
        const url = `${this.config.baseUrl}/${entity}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
        const result = await response.json();
        return result.id || '';
    }

    async update(entity: string, id: string, data: Record<string, unknown>): Promise<boolean> {
        const url = `${this.config.baseUrl}/${entity}/${id}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
        return response.ok;
    }

    disconnect(): void { }
}
