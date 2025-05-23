import * as grpc from '@grpc/grpc-js';
import { loadPackageDefinition } from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

interface MetricRequest {
    eventType: string;
    data: string;
}

interface MetricResponse {
    status: string;
    message: string;
}

class APIClient {
    private static instance: APIClient;
    private client: any;
    private isConnected: boolean = false;
    private serverAddress: string;

    private constructor(serverAddress: string, protoPath: string, packageName: string, serviceName: string) {
        this.serverAddress = serverAddress;
        
        try {
            console.log(`🔌 Initializing gRPC Client for ${serverAddress}`);
            
            const packageDefinition = protoLoader.loadSync(protoPath, {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
            });
            
            console.log('✅ Package Definition Loaded');
            
            const protoDescriptor = loadPackageDefinition(packageDefinition);
            console.log('✅ Proto Descriptor Loaded');
            
            // Navigate to the service
            const packageObj = (protoDescriptor as any)[packageName];
            if (!packageObj) {
                throw new Error(`Package '${packageName}' Not Found`);
            }
            
            const service = packageObj[serviceName];
            if (!service) {
                throw new Error(`Service '${serviceName}' Not Found`);
            }
            
            console.log(`✅ Service '${serviceName}' Found`);
            
            this.client = new service(serverAddress, grpc.credentials.createInsecure());
            console.log('✅ gRPC Client Created');

            // Test the connection
            this.testConnection();
            
        } catch (error) {
            console.error('❌ Failed to Initialize gRPC Client:', error);
            throw error;
        }
    }

    private testConnection(): void {
        console.log('🔍 Testing gRPC Connection...');
        
        this.client.waitForReady(Date.now() + 10000, (error: any) => {
            if (error) {
                console.error('❌ gRPC Connection Failed:', error);
                this.isConnected = false;
            } else {
                console.log('✅ gRPC Connection Established Successfully');
                this.isConnected = true;
            }
        });
    }

    static getInstance(serverAddress: string, protoPath: string, packageName: string, serviceName: string): APIClient {
        if (!APIClient.instance) {
            APIClient.instance = new APIClient(serverAddress, protoPath, packageName, serviceName);
        }
        return APIClient.instance;
    }

    sendMessage(method: string, message: MetricRequest): Promise<MetricResponse> {
        return new Promise((resolve, reject) => {
            console.log(`📤 Calling gRPC Method: ${method}`);
            console.log(`📦 Message:`, message);
            
            // Add timeout to the call
            const deadline = new Date();
            deadline.setSeconds(deadline.getSeconds() + 10);
            
            this.client[method](message, { deadline }, (error: any, response: MetricResponse) => {
                if (error) {
                    console.error('❌ gRPC Call Failed:', error);
                    console.error('❌ Error Code:', error.code);
                    console.error('❌ Error Details:', error.details);
                    reject(error);
                } else {
                    console.log('✅ gRPC Call Successful:', response);
                    resolve(response);
                }
            });
        });
    }

    getConnectionStatus(): boolean {
        return this.isConnected;
    }
}

export default APIClient;