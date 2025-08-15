import type { APIRoute } from 'astro';
import DomainValidator from '../../lib/security/domainValidator';

export const POST: APIRoute = async ({ request, locals }) => {
  const domainValidator = new DomainValidator();
  
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  const validation = domainValidator.validateRequest(request);
  const allowedDomains = domainValidator.getAllowedDomains();
  const isDevMode = domainValidator.isDevMode();
  
  return new Response(JSON.stringify({
    requestOrigin: origin,
    requestReferer: referer,
    validation: validation,
    allowedDomains: allowedDomains,
    isDevMode: isDevMode,
    debug: {
      originIncluded: allowedDomains.includes(origin || ''),
      exactOriginCheck: origin ? allowedDomains.includes(origin) : false
    }
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
