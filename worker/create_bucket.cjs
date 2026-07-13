const { S3Client, CreateBucketCommand, ListBucketsCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: 'https://e046244d4062213ba09286bde499acb9.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '6e7ea34b51b19fda14165457c8f7f7a2',
    secretAccessKey: '0549982621cfed820a906b381790b5f91fb3d620d2ce26a14e17f42913efba50',
  }
});

async function main() {
  try {
    const listRes = await s3Client.send(new ListBucketsCommand({}));
    console.log('Existing buckets:', listRes.Buckets.map(b => b.Name));

    const bucketName = 'aether';
    if (!listRes.Buckets.find(b => b.Name === bucketName)) {
      console.log(`Creating bucket ${bucketName}...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`Bucket ${bucketName} created successfully.`);
    } else {
      console.log(`Bucket ${bucketName} already exists.`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
