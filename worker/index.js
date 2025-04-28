export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const { onedriveLink } = await request.json();
      if (!onedriveLink) {
        return new Response('Invalid Request', { status: 400 });
      }

      const fetchResponse = await fetch(onedriveLink);
      if (!fetchResponse.ok) {
        throw new Error('Failed to fetch file from OneDrive.');
      }

      const fileData = await fetchResponse.arrayBuffer();
      const fileName = `upload-${Date.now()}`;

      await env.R2_BUCKET.put(fileName, fileData, {
        httpMetadata: {
          contentType: fetchResponse.headers.get('content-type') || 'application/octet-stream'
        },
        customMetadata: {
          uploadedAt: Date.now().toString()
        }
      });

      const downloadUrl = `https://${env.ACCOUNT_ID}.r2.dev/${env.R2_BUCKET.bucketName}/${fileName}`;

      return new Response(JSON.stringify({ success: true, downloadUrl }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }
};
