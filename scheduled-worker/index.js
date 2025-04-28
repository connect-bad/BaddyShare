export default {
  async scheduled(event, env, ctx) {
    const list = await env.R2_BUCKET.list();

    const now = Date.now();
    for (const object of list.objects) {
      const uploadedAt = parseInt(object.metadata?.uploadedAt || '0', 10);
      if (uploadedAt && (now - uploadedAt) > 24 * 60 * 60 * 1000) { // older than 1 day
        await env.R2_BUCKET.delete(object.key);
        console.log(`Deleted: ${object.key}`);
      }
    }
  }
};
