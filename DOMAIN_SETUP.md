# Domain and SSL Setup Guide

This guide covers setting up custom domains and SSL certificates for the Parking Finder application across different hosting platforms.

## Netlify Domain Setup

### Custom Domain Configuration

1. **Add Domain in Netlify Dashboard**
   - Go to Site Settings > Domain management
   - Click "Add custom domain"
   - Enter your domain (e.g., `parking.yourtown.gov`)

2. **DNS Configuration**
   - **Option A: Netlify DNS (Recommended)**
     - Change nameservers at your domain registrar to Netlify's:
       - `dns1.p01.nsone.net`
       - `dns2.p01.nsone.net`
       - `dns3.p01.nsone.net`
       - `dns4.p01.nsone.net`
   
   - **Option B: External DNS**
     - Add CNAME record: `parking.yourtown.gov` → `your-site-name.netlify.app`
     - For apex domain, add A records to Netlify's load balancer IP

3. **SSL Certificate**
   - Netlify automatically provisions Let's Encrypt SSL certificates
   - Certificate auto-renews every 90 days
   - Force HTTPS redirect is enabled by default

### Netlify Configuration File Update

Add to `netlify.toml`:

```toml
[build.environment]
  CUSTOM_DOMAIN = "parking.yourtown.gov"

[[redirects]]
  from = "http://parking.yourtown.gov/*"
  to = "https://parking.yourtown.gov/:splat"
  status = 301
  force = true
```

## Vercel Domain Setup

### Custom Domain Configuration

1. **Add Domain in Vercel Dashboard**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **DNS Configuration**
   - Add CNAME record: `parking.yourtown.gov` → `cname.vercel-dns.com`
   - For apex domain, add A record: `yourtown.gov` → `76.76.19.61`

3. **SSL Certificate**
   - Vercel automatically provisions SSL certificates
   - Supports both Let's Encrypt and custom certificates
   - Auto-renewal included

## GitHub Pages Domain Setup

### Custom Domain Configuration

1. **Repository Settings**
   - Go to Settings > Pages
   - Enter custom domain in "Custom domain" field
   - Enable "Enforce HTTPS"

2. **DNS Configuration**
   - Add CNAME record: `parking.yourtown.gov` → `yourusername.github.io`
   - For apex domain, add A records to GitHub's IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`

3. **CNAME File**
   - Create `CNAME` file in repository root with your domain

### GitHub Pages CNAME File

```
parking.yourtown.gov
```

## Government Domain Considerations

### .gov Domain Requirements

1. **Eligibility**
   - Must be a U.S. government organization
   - Requires authorization from appropriate government authority

2. **Security Requirements**
   - HTTPS is mandatory for all .gov domains
   - HSTS (HTTP Strict Transport Security) recommended
   - Regular security audits may be required

3. **Compliance**
   - Follow government web standards (Section 508 accessibility)
   - Implement required privacy policies
   - Consider FISMA compliance requirements

### Additional Security Headers

Add to hosting configuration:

```toml
# Netlify
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;"
```

## Subdomain Setup

### For Municipal Websites

If you want to use a subdomain like `parking.cityname.gov`:

1. **DNS Configuration**
   - Add CNAME record: `parking` → hosting platform domain
   - Ensure parent domain DNS allows subdomain delegation

2. **Certificate Coverage**
   - Most hosting platforms support wildcard certificates
   - Verify subdomain is covered by SSL certificate

3. **Redirect Setup**
   - Consider redirecting from main city website
   - Add navigation links from main municipal site

## Testing Domain Setup

### Verification Steps

1. **DNS Propagation**
   ```bash
   # Check DNS resolution
   nslookup parking.yourtown.gov
   
   # Check from multiple locations
   dig parking.yourtown.gov @8.8.8.8
   ```

2. **SSL Certificate**
   ```bash
   # Check SSL certificate
   openssl s_client -connect parking.yourtown.gov:443 -servername parking.yourtown.gov
   ```

3. **HTTP Headers**
   ```bash
   # Check security headers
   curl -I https://parking.yourtown.gov
   ```

### Common Issues

1. **DNS Propagation Delay**
   - Can take up to 48 hours globally
   - Use DNS checker tools to monitor progress

2. **SSL Certificate Issues**
   - Ensure domain is properly verified
   - Check for mixed content warnings

3. **Redirect Loops**
   - Verify redirect configuration
   - Check for conflicting rules

## Monitoring and Maintenance

### Domain Health Monitoring

1. **Uptime Monitoring**
   - Set up monitoring for domain availability
   - Monitor SSL certificate expiration
   - Track DNS resolution times

2. **Performance Monitoring**
   - Use tools like Google PageSpeed Insights
   - Monitor Core Web Vitals
   - Track loading times from different locations

3. **Security Monitoring**
   - Regular SSL certificate checks
   - Monitor for security header compliance
   - Check for mixed content issues

### Renewal and Maintenance

1. **Domain Renewal**
   - Set up auto-renewal for domain registration
   - Monitor expiration dates
   - Keep contact information updated

2. **Certificate Management**
   - Hosting platforms handle automatic renewal
   - Monitor for any renewal failures
   - Have backup certificate process if needed

3. **DNS Management**
   - Regular DNS record audits
   - Document all DNS changes
   - Maintain backup DNS configuration