// ImageCard.jsx — simple styled image card for the product showcase section
const ImageCard = ({ src, alt = 'Product' }) => (
  <div className="rounded-xl overflow-hidden shadow-md border border-stone-200 bg-white group">
    <img
      src={src}
      alt={alt}
      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
    />
  </div>
);

export default ImageCard;
