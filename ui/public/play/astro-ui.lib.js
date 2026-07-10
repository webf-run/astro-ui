// ../lib/src/components/Navbar.astro
import {
  render as $$render5,
  createAstro as $$createAstro5,
  createComponent as $$createComponent5,
  renderComponent as $$renderComponent5,
  maybeRenderHead as $$maybeRenderHead5,
  addAttribute as $$addAttribute5,
  spreadAttributes as $$spreadAttributes5
} from "astro/runtime/server/index.js";

// ../node_modules/.pnpm/lucide-astro@0.556.0_astro@_d4c7fda2328fe30c592d45f2dd106ae4/node_modules/lucide-astro/dist/.Layout.astro
import {
  render as $$render,
  createAstro as $$createAstro,
  createComponent as $$createComponent,
  maybeRenderHead as $$maybeRenderHead,
  renderSlot as $$renderSlot,
  addAttribute as $$addAttribute,
  spreadAttributes as $$spreadAttributes
} from "astro/runtime/server/index.js";
var $$Astro = $$createAstro();
var $$stdin = $$createComponent(($$result, $$props, $$slots) => {
  const Astro = $$result.createAstro($$props, $$slots);
  Astro.self = $$stdin;
  const size = Astro.props.size;
  const cls = Astro.props.class;
  const name = Astro.props.iconName;
  delete Astro.props.size;
  delete Astro.props.class;
  delete Astro.props.iconName;
  const props = Object.assign({
    "xmlns": "http://www.w3.org/2000/svg",
    "stroke-width": 2,
    "width": size ?? 24,
    "height": size ?? 24,
    "stroke": "currentColor",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "fill": "none",
    "viewBox": "0 0 24 24"
  }, Astro.props);
  return $$render`${$$maybeRenderHead($$result)}<svg${$$spreadAttributes(props)}${$$addAttribute(["lucide", { [`lucide-${name}`]: name }, cls], "class:list")}>
	${$$renderSlot($$result, $$slots["default"])}
</svg>`;
}, "<stdin>", void 0);
var Layout_default = $$stdin;

// ../node_modules/.pnpm/lucide-astro@0.556.0_astro@_d4c7fda2328fe30c592d45f2dd106ae4/node_modules/lucide-astro/dist/ArrowRight.astro
import {
  render as $$render2,
  createAstro as $$createAstro2,
  createComponent as $$createComponent2,
  renderComponent as $$renderComponent2,
  maybeRenderHead as $$maybeRenderHead2
} from "astro/runtime/server/index.js";
var $$Astro2 = $$createAstro2();
var $$stdin2 = $$createComponent2(($$result, $$props, $$slots) => {
  const Astro = $$result.createAstro($$props, $$slots);
  Astro.self = $$stdin2;
  return $$render2`${$$renderComponent2($$result, "Layout", Layout_default, { "iconName": "arrow-right", ...Astro.props }, { "default": () => $$render2`
	${$$maybeRenderHead2($$result)}<path d="M5 12h14"></path>
	<path d="m12 5 7 7-7 7"></path>
` })}`;
}, "<stdin>", void 0);
var ArrowRight_default = $$stdin2;

// ../node_modules/.pnpm/lucide-astro@0.556.0_astro@_d4c7fda2328fe30c592d45f2dd106ae4/node_modules/lucide-astro/dist/ChevronDown.astro
import {
  render as $$render3,
  createAstro as $$createAstro3,
  createComponent as $$createComponent3,
  renderComponent as $$renderComponent3,
  maybeRenderHead as $$maybeRenderHead3
} from "astro/runtime/server/index.js";
var $$Astro3 = $$createAstro3();
var $$stdin3 = $$createComponent3(($$result, $$props, $$slots) => {
  const Astro = $$result.createAstro($$props, $$slots);
  Astro.self = $$stdin3;
  return $$render3`${$$renderComponent3($$result, "Layout", Layout_default, { "iconName": "chevron-down", ...Astro.props }, { "default": () => $$render3`
	${$$maybeRenderHead3($$result)}<path d="m6 9 6 6 6-6"></path>
` })}`;
}, "<stdin>", void 0);
var ChevronDown_default = $$stdin3;

// ../lib/src/components/Button.astro
import {
  render as $$render4,
  createAstro as $$createAstro4,
  createComponent as $$createComponent4,
  renderComponent as $$renderComponent4,
  maybeRenderHead as $$maybeRenderHead4,
  renderSlot as $$renderSlot4,
  addAttribute as $$addAttribute4,
  spreadAttributes as $$spreadAttributes4
} from "astro/runtime/server/index.js";
var $$Astro4 = $$createAstro4();
var $$stdin4 = $$createComponent4(($$result, $$props, $$slots) => {
  const Astro = $$result.createAstro($$props, $$slots);
  Astro.self = $$stdin4;
  const {
    variant = "primary",
    size = "md",
    href,
    disabled = false,
    loading = false,
    type = "button",
    class: className = "",
    style = "",
    target,
    rel,
    showIcon = false,
    icon: Icon,
    ...rest
  } = Astro.props;
  const baseClasses = `
  inline-flex
  items-center
  justify-center
  gap-2
  rounded-lg
  font-semibold
  transition-all
  duration-300
  focus:outline-none
  focus:ring-2
`;
  const variants = {
    primary: `
    bg-orange-400
    text-black
  `,
    secondary: `
    bg-white
    text-purple-700
    border
    border-purple-200
  `,
    success: `
    bg-transparent
    border
    border-white
    text-white
  `,
    purple: `
    bg-purple-800
    text-white
    border
    border-purple-200
    rounded-md
    text-sm
    transition
  `,
    blackwhite: `
    bg-white
    text-gray-600
    text-sm
    border
    border-gray-300
  `
  };
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-[14px]",
    lg: "px-8 py-4 text-lg"
  };
  const disabledClasses = disabled || loading ? "opacity-50 cursor-not-allowed pointer-events-none" : "";
  const buttonClasses = `
  ${baseClasses}
  ${variants[variant]}
  ${sizes[size]}
  ${disabledClasses}
  ${className}
`;
  return $$render4`${href ? $$render4`${$$maybeRenderHead4($$result)}<a${$$addAttribute4(href, "href")}${$$addAttribute4(target, "target")}${$$addAttribute4(rel, "rel")}${$$addAttribute4(style, "style")}${$$addAttribute4(buttonClasses, "class")}${$$addAttribute4(disabled, "aria-disabled")}${$$spreadAttributes4(rest)}>
      <span>${loading ? "Loading..." : $$render4`${$$renderSlot4($$result, $$slots["default"])}`}</span>

      ${showIcon && !loading && $$render4`${$$renderComponent4($$result, "ArrowRight", ArrowRight_default, { "size": 18 })}`}
    </a>` : $$render4`<button${$$addAttribute4(type, "type")}${$$addAttribute4(disabled || loading, "disabled")}${$$addAttribute4(style, "style")}${$$addAttribute4(buttonClasses, "class")}${$$spreadAttributes4(rest)}>
      ${" "}
      <span>${loading ? "Loading..." : $$render4`${$$renderSlot4($$result, $$slots["default"])}`}</span>
      ${showIcon && !loading && $$render4`${$$renderComponent4($$result, "ArrowRight", ArrowRight_default, { "size": 18 })}`}
      ${Icon && $$render4`${$$renderComponent4($$result, "Icon", Icon, { "size": 16, "strokeWidth": 2 })}`}
    </button>`}`;
}, "<stdin>", void 0);
var Button_default = $$stdin4;

// ../lib/src/components/Navbar.astro
var $$Astro5 = $$createAstro5();
var $$stdin5 = $$createComponent5(($$result, $$props, $$slots) => {
  const Astro = $$result.createAstro($$props, $$slots);
  Astro.self = $$stdin5;
  const {
    logoSrc,
    logoText,
    navItems = [],
    class: className = "",
    style = "",
    ...rest
  } = Astro.props;
  return $$render5`${$$maybeRenderHead5($$result)}<nav class="fixed top-0 left-0 w-full bg-white z-50 shadow-sm"${$$addAttribute5(style, "style")}${$$spreadAttributes5(rest)}>
  <div class="max-w-screen-2xl mx-auto px-8">
    <div class="flex items-center justify-between h-20">
      <a href="/" class="flex items-center"${$$addAttribute5(style, "style")}>
        ${logoSrc && $$render5`<img${$$addAttribute5(logoSrc, "src")} alt="Logo" class="h-12 w-auto object-contain">`}

        ${!logoSrc && logoText && $$render5`<span class="text-2xl font-bold text-gray-900">${logoText}</span>`}
      </a>

      <div class="flex items-center gap-8"${$$addAttribute5(style, "style")}>
        ${navItems.map((item) => $$render5`<a${$$addAttribute5(item.href, "href")}${$$addAttribute5(`
                flex items-center gap-1
                text-[15px]
                font-medium
                transition-colors
              ${className}`, "class")}>
              <span>${item.label}</span>

              ${item.hasDropdown && $$render5`${$$renderComponent5($$result, "ChevronDown", ChevronDown_default, { "size": 16, "strokeWidth": 2 })}`}
            </a>`)}
      </div>

      <div class="flex items-center gap-5"${$$addAttribute5(style, "style")}>
        ${$$renderComponent5($$result, "Button", Button_default, { "variant": "purple" }, { "default": () => $$render5` Apply Now ` })}
      </div>
    </div>
  </div>
</nav>`;
}, "<stdin>", void 0);
var Navbar_default = $$stdin5;

// ../lib/src/components/SectionBadge.astro
import {
  render as $$render6,
  createAstro as $$createAstro6,
  createComponent as $$createComponent6,
  maybeRenderHead as $$maybeRenderHead6,
  renderSlot as $$renderSlot6,
  addAttribute as $$addAttribute6
} from "astro/runtime/server/index.js";
var $$Astro6 = $$createAstro6();
var $$stdin6 = $$createComponent6(($$result, $$props, $$slots) => {
  const Astro = $$result.createAstro($$props, $$slots);
  Astro.self = $$stdin6;
  const { class: className = "" } = Astro.props;
  return $$render6`${$$maybeRenderHead6($$result)}<span${$$addAttribute6(`
    inline-flex
    items-center
    justify-center
    px-4
    py-3
    rounded-full
    text-xs
    font-semibold
    tracking-[0.12em]
    ${className}
  `, "class")}>
  ${$$renderSlot6($$result, $$slots["default"])}
</span>`;
}, "<stdin>", void 0);
var SectionBadge_default = $$stdin6;

// ../lib/src/components/StatCard.astro
import {
  render as $$render7,
  createAstro as $$createAstro7,
  createComponent as $$createComponent7,
  renderComponent as $$renderComponent7,
  maybeRenderHead as $$maybeRenderHead7
} from "astro/runtime/server/index.js";
var $$Astro7 = $$createAstro7();
var $$stdin7 = $$createComponent7(($$result, $$props, $$slots) => {
  const Astro = $$result.createAstro($$props, $$slots);
  Astro.self = $$stdin7;
  const { icon: Icon, value, label } = Astro.props;
  return $$render7`${$$maybeRenderHead7($$result)}<div class="rounded-xl
    px-3 py-4
    text-center
    w-full
    sm:max-w-[220px]
    lg:max-w-none
    mx-auto
    bg-purple-100
    border border-violet-100">
  ${$$renderComponent7($$result, "Icon", Icon, { "class": "w-5 h-5 mx-auto mb-2 text-violet-800" })}

  <h3 class="font-bold text-lg sm:text-xl whitespace-nowrap">
    ${value}
  </h3>

  <p class="text-xs text-zinc-700">
    ${label}
  </p>
</div>`;
}, "<stdin>", void 0);
var StatCard_default = $$stdin7;

// ../lib/src/components/FeatureCard.astro
import {
  render as $$render8,
  createAstro as $$createAstro8,
  createComponent as $$createComponent8,
  renderComponent as $$renderComponent8,
  maybeRenderHead as $$maybeRenderHead8,
  addAttribute as $$addAttribute8
} from "astro/runtime/server/index.js";
var $$Astro8 = $$createAstro8();
var $$stdin8 = $$createComponent8(($$result, $$props, $$slots) => {
  const Astro = $$result.createAstro($$props, $$slots);
  Astro.self = $$stdin8;
  const { title, subtitle, icon: Icon, class: className = "" } = Astro.props;
  return $$render8`${$$maybeRenderHead8($$result)}<div class="bg-white
  border border-violet-100
  rounded-xl
  p-4
  flex items-center gap-4">
  <div${$$addAttribute8(`w-10 h-10
    rounded-lg
    flex items-center justify-center
    bg-purple-200`, "class")}>
    ${$$renderComponent8($$result, "Icon", Icon, { "class": "w-5 h-5 text-violet-800" })}
  </div>

  <div>
    <h4 class="font-semibold">
      ${title}
    </h4>

    <p class="text-xs text-neutral-700">
      ${subtitle}
    </p>
  </div>
</div>`;
}, "<stdin>", void 0);
var FeatureCard_default = $$stdin8;

// ../lib/src/components/CompanyLogoCard.astro
import {
  render as $$render9,
  createAstro as $$createAstro9,
  createComponent as $$createComponent9,
  maybeRenderHead as $$maybeRenderHead9,
  addAttribute as $$addAttribute9
} from "astro/runtime/server/index.js";
var $$Astro9 = $$createAstro9();
var $$stdin9 = $$createComponent9(($$result, $$props, $$slots) => {
  const Astro = $$result.createAstro($$props, $$slots);
  Astro.self = $$stdin9;
  const { logo, companyName, class: className = "" } = Astro.props;
  return $$render9`${$$maybeRenderHead9($$result)}<a target="_blank" rel="noopener noreferrer"${$$addAttribute9(`
    flex items-center justify-center
    w-35 h-23
    rounded-xl border bg-white
    p-4
    transition-transform duration-200
    hover:scale-105
    ${className}
  `, "class")}>
  <img${$$addAttribute9(logo, "src")}${$$addAttribute9(`${companyName} Logo`, "alt")} class="h-12 w-auto object-contain">
</a>`;
}, "<stdin>", void 0);
var CompanyLogoCard_default = $$stdin9;

// ../lib/src/components/PlacementStatCard.astro
import {
  render as $$render10,
  createAstro as $$createAstro10,
  createComponent as $$createComponent10,
  renderComponent as $$renderComponent10,
  maybeRenderHead as $$maybeRenderHead10
} from "astro/runtime/server/index.js";
var $$Astro10 = $$createAstro10();
var $$stdin10 = $$createComponent10(($$result, $$props, $$slots) => {
  const Astro = $$result.createAstro($$props, $$slots);
  Astro.self = $$stdin10;
  const {
    icon: Icon,
    value,
    title,
    subtitle,
    class: className = ""
  } = Astro.props;
  return $$render10`${$$maybeRenderHead10($$result)}<div class="rounded-2xl
  px-6 py-5
  w-full
  md:w-45
  text-center
  bg-purple-100
  border
  border-violet-100">
  <div class="bg-purple-400! rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
    ${$$renderComponent10($$result, "Icon", Icon, { "class": "w-4 h-4 text-violet-800" })}
  </div>

  <h3 class="text-2xl font-bold text-black">
    ${value}
  </h3>

  <p class="mt-2 text-sm font-semibold text-black">
    ${title}
  </p>

  <p class="mt-1 text-[11px] text-zinc-700">
    ${subtitle}
  </p>
</div>`;
}, "<stdin>", void 0);
var PlacementStatCard_default = $$stdin10;
export {
  Button_default as Button,
  CompanyLogoCard_default as CompanyLogoCard,
  FeatureCard_default as FeatureCard,
  Navbar_default as Navbar,
  PlacementStatCard_default as PlacementStatCard,
  SectionBadge_default as SectionBadge,
  StatCard_default as StatCard
};
