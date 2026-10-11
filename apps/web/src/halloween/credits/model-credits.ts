import { m } from "../../paraglide/messages.js";
import type { CreditSection } from "./asset-credits";

const sketchfab = (slug: string): string => `https://sketchfab.com/3d-models/${slug}`;

export const MODEL_CREDITS: CreditSection = {
  heading: m.halloween_credits_models,
  credits: [
    [
      "Frames, lights, fire alarm, clock, TV, armchair, rock",
      "Poly Haven",
      "https://polyhaven.com",
    ],
    [
      "Infinite 3D Head Scan",
      "Lee Perry-Smith",
      "https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/LeePerrySmith",
    ],
    [
      "Emergency Escape Light",
      "Gurazh",
      sketchfab("emergency-escape-light-ffef66624e0840b489868628dda1736e"),
    ],
    [
      "Concrete Stairs",
      "Periltek Games",
      sketchfab("concrete-stairs-b552862f1bff4a968fa65da90c6a9e6b"),
    ],
    [
      "Fulleon Roshni Sounder",
      "dylanheyes",
      sketchfab("fulleon-roshni-sounder-28952d42af184dcca94b4e4ef0ae804b"),
    ],
    ["Old Baby Crib", "Rukas", sketchfab("old-baby-crib-b945651a5fa841b7aef4ea4da81fcc39")],
    ["Doll 4", "IUPUI University Library", sketchfab("doll-4-5be2b6019f804566a8a390c6e0725e25")],
    ["Old Teddy Bear", "ay614", sketchfab("old-teddy-bear-b1d01365d6414b599f7f2297c9494857")],
    [
      "Grungy Teddy Bear",
      "Joel Davenport",
      sketchfab("grungy-teddy-bear-2964995f7512435abc447e8feecdab9c"),
    ],
  ],
};

export const IMAGE_CREDITS: CreditSection = {
  heading: m.halloween_credits_images,
  credits: [
    ["Wallpaper, tiles, wood, concrete, rock", "ambientCG", "https://ambientcg.com"],
    [
      "Rire naturel, 1862",
      "Duchenne de Boulogne, Cleveland Museum of Art",
      "https://commons.wikimedia.org/wiki/File:Guillaume-Benjamin-Amand_Duchenne_(de_Boulogne)_-_Figure_32-_Rire_naturel_par_la_contraction_volontaire_des_deux_grands_zygom_-_2018.9_-_Cleveland_Museum_of_Art.tif",
    ],
  ],
};

export const CODE_CREDITS: CreditSection = {
  heading: m.halloween_credits_code,
  credits: [
    ["three.js", "three.js authors", "https://github.com/mrdoob/three.js"],
    ["React", "Meta", "https://github.com/facebook/react"],
    ["Vite", "VoidZero", "https://github.com/vitejs/vite"],
  ],
};
