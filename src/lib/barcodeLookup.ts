export interface ExternalProductInfo {
  name: string;
  imageUrl: string | null;
  source: 'Open Food Facts';
}

/**
 * Fetch product information by JAN / Barcode from Open Food Facts API
 */
export const fetchProductByJanCode = async (janCode: string): Promise<ExternalProductInfo | null> => {
  const cleanJan = janCode.trim();
  if (!cleanJan) return null;

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${cleanJan}.json`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.status === 1 && data.product) {
      const p = data.product;
      const productName = p.product_name_ja || p.product_name || p.abbreviated_product_name || '';
      const imageUrl = p.image_front_url || p.image_url || p.image_front_small_url || null;

      if (productName || imageUrl) {
        return {
          name: productName.trim(),
          imageUrl: imageUrl,
          source: 'Open Food Facts'
        };
      }
    }
  } catch (error) {
    console.warn('Open Food Facts API request error:', error);
  }

  return null;
};
