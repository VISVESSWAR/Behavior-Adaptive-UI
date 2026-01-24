import useUIVariants from "../adaptation/useUIVariants";
import {
  AdaptiveHeading,
  AdaptiveParagraph,
  AdaptiveLabel,
} from "./AdaptiveText";
import AdaptiveButton from "./AdaptiveButton";

export default function AdaptiveShowcase() {
  const ui = useUIVariants();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-lg border-2 border-blue-200 mb-8">
      <AdaptiveHeading level={2} className="text-blue-900 mb-6">
        UI Adaptation Showcase
      </AdaptiveHeading>

      {/* Grid of showcase items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Button Size */}
        <div className={`${ui.shadow} ${ui.radius} p-4 bg-white`}>
          <AdaptiveLabel className="text-gray-600 block mb-3">
            Button Size
          </AdaptiveLabel>
          <AdaptiveButton className="w-full">Sample Button</AdaptiveButton>
        </div>

        {/* Text Size */}
        <div className={`${ui.shadow} ${ui.radius} p-4 bg-white`}>
          <AdaptiveLabel className="text-gray-600 block mb-3">
            Text Size
          </AdaptiveLabel>
          <AdaptiveParagraph className={`${ui.lineHeight}`}>
            This text adapts its size and line height
          </AdaptiveParagraph>
        </div>

        {/* Font Weight */}
        <div className={`${ui.shadow} ${ui.radius} p-4 bg-white`}>
          <AdaptiveLabel className="text-gray-600 block mb-3">
            Font Weight
          </AdaptiveLabel>
          <p className={`${ui.font} text-base`}>
            Bold or light text appears here
          </p>
        </div>

        {/* Spacing */}
        <div className={`${ui.shadow} ${ui.radius} p-4 bg-white`}>
          <AdaptiveLabel className="text-gray-600 block mb-3">
            Spacing
          </AdaptiveLabel>
          <div className={`${ui.spacing} flex flex-wrap`}>
            <span className="bg-blue-100 px-2 py-1 rounded">Item 1</span>
            <span className="bg-blue-100 px-2 py-1 rounded">Item 2</span>
          </div>
        </div>

        {/* Border Radius */}
        <div className={`${ui.shadow} p-4 bg-white rounded-sm`}>
          <AdaptiveLabel className="text-gray-600 block mb-3">
            Border Radius
          </AdaptiveLabel>
          <div
            className={`${ui.radius} bg-gradient-to-r from-purple-400 to-pink-400 h-16`}
          ></div>
        </div>

        {/* Shadow Levels */}
        <div className={`${ui.shadow} ${ui.radius} p-4 bg-white`}>
          <AdaptiveLabel className="text-gray-600 block mb-3">
            Shadow Depth
          </AdaptiveLabel>
          <div
            className={`${ui.shadow} ${ui.radius} bg-white p-4 bg-gradient-to-br from-yellow-100 to-orange-100`}
          >
            Shadows enhance depth
          </div>
        </div>

        {/* Line Height */}
        <div className={`${ui.shadow} ${ui.radius} p-4 bg-white`}>
          <AdaptiveLabel className="text-gray-600 block mb-3">
            Line Height
          </AdaptiveLabel>
          <p className={`${ui.lineHeight} text-sm`}>
            Text with flexible{"\n"}line height for{"\n"}readability
          </p>
        </div>

        {/* Icon Size */}
        <div className={`${ui.shadow} ${ui.radius} p-4 bg-white text-center`}>
          <AdaptiveLabel className="text-gray-600 block mb-3">
            Icon Size
          </AdaptiveLabel>
          <div className={`${ui.icon}`}>🎯</div>
        </div>

        {/* Card Padding */}
        <div className={`${ui.shadow} ${ui.radius} bg-white`}>
          <div
            className={`${ui.cardPadding} bg-gradient-to-br from-green-100 to-blue-100`}
          >
            <AdaptiveLabel className="text-gray-700">
              Card Padding Level
            </AdaptiveLabel>
          </div>
        </div>

        {/* Combined Elements */}
        <div
          className={`${ui.shadow} ${ui.radius} ${ui.cardPadding} bg-white col-span-1 md:col-span-2 lg:col-span-2`}
        >
          <AdaptiveHeading level={3} className="text-gray-900 mb-3">
            Fully Adaptive Card
          </AdaptiveHeading>
          <div className={`${ui.spacing} flex flex-wrap mb-4`}>
            <span className={`${ui.radius} bg-indigo-100 px-3 py-2 text-sm`}>
              Size
            </span>
            <span className={`${ui.radius} bg-indigo-100 px-3 py-2 text-sm`}>
              Weight
            </span>
            <span className={`${ui.radius} bg-indigo-100 px-3 py-2 text-sm`}>
              Spacing
            </span>
          </div>
          <AdaptiveButton>See All Changes</AdaptiveButton>
        </div>
      </div>

      {/* Current State Display */}
      <div
        className={`${ui.shadow} ${ui.radius} ${ui.cardPadding} bg-white mt-6`}
      >
        <AdaptiveHeading level={3} className="text-gray-900 mb-4">
          Current Adaptation State
        </AdaptiveHeading>
        <div
          className={`${ui.spacing} grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4`}
        >
          <div className="text-center">
            <p className="text-gray-600 text-xs font-medium mb-1">Button</p>
            <p className={`${ui.font} text-lg text-blue-600`}>
              {useUIVariants().button?.split(" ")[0] || "px-4"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-xs font-medium mb-1">Text</p>
            <p className={`${ui.font} text-lg text-blue-600`}>
              {useUIVariants().text || "text-base"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-xs font-medium mb-1">Weight</p>
            <p className={`${ui.font} text-lg text-blue-600`}>
              {useUIVariants().font || "normal"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-xs font-medium mb-1">Spacing</p>
            <p className={`${ui.font} text-lg text-blue-600`}>
              {useUIVariants().spacing || "gap-3"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-xs font-medium mb-1">Radius</p>
            <p className={`${ui.font} text-lg text-blue-600`}>
              {useUIVariants().radius || "rounded"}
            </p>
          </div>
        </div>
      </div>

      <AdaptiveParagraph className="text-center text-gray-600 mt-6 text-xs">
        All elements update dynamically as adaptation levels change. Changes
        persist across sessions.
      </AdaptiveParagraph>
    </div>
  );
}
