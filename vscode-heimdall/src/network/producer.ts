import grpc from '@grpc/grpc-js';
import { loadPackageDefinition } from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

type Message = Record<string, any>;

class GrpcProducer {
    private static instance: GrpcProducer;
    private client: any;

    private constructor(serverAddress: string, protoPath: string, packageName: string, serviceName: string) {
        const packageDefinition = protoLoader.loadSync(protoPath, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });
        const protoDescriptor = loadPackageDefinition(packageDefinition);
        const service = (protoDescriptor as any)[packageName][serviceName];
        this.client = new service(serverAddress, grpc.credentials.createInsecure());
    }

    static getInstance(serverAddress: string, protoPath: string, packageName: string, serviceName: string) {
        if (!GrpcProducer.instance) {
            GrpcProducer.instance = new GrpcProducer(serverAddress, protoPath, packageName, serviceName);
        }
        return GrpcProducer.instance;
    }

    sendMessage(method: string, message: Message): Promise<any> {
        return new Promise((resolve, reject) => {
            this.client[method](message, (error: any, response: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        });
    }
}

export default GrpcProducer;