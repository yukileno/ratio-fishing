import * as THREE from 'three'
import { GLTFLoader } from './vendor/GLTFLoader.js'

const palettes = [
  { sky: 0xb9e8ed, land: 0x84bc50, edge: 0x6e5639, water: 0x3295af, path: 0xddc48b },
  { sky: 0xb8ebfc, land: 0xf2d996, edge: 0xc19c65, water: 0x299abd, path: 0xeabe78 },
  { sky: 0x282e58, land: 0x656181, edge: 0x403656, water: 0x327994, path: 0x9b86ac },
  { sky: 0xb5dfda, land: 0x629b60, edge: 0x5a6f62, water: 0x387e72, path: 0xbca87b, canopy: 0x337c52, grass: true },
  { sky: 0xefca94, land: 0xb7924c, edge: 0x996447, water: 0x528d95, path: 0xdfbc86, canopy: 0xd87937 },
  { sky: 0x444a8a, land: 0xd7ecf3, edge: 0x849ab3, water: 0x4b94ab, path: 0xcedbe9, canopy: 0x9ac9cf, night: true },
  { sky: 0xa0605e, land: 0x544859, edge: 0x382f3c, water: 0x59475f, path: 0x91736f, night: true },
  { sky: 0xaadce8, land: 0xe8cf9e, edge: 0x8bb5ab, water: 0x25adab, path: 0xf2dca5 },
  { sky: 0x262b61, land: 0x4d557c, edge: 0x282b4a, water: 0x355e9e, path: 0x8787ad, night: true },
  { sky: 0xb7cbc0, land: 0x637e48, edge: 0x485e47, water: 0x567c69, path: 0xa9ae79, canopy: 0x486d54 },
  { sky: 0xa6cdb1, land: 0x597447, edge: 0x455844, water: 0x368477, path: 0xc7b489, canopy: 0x507b37 },
  { sky: 0xaad7ef, land: 0x94af61, edge: 0x72835d, water: 0x519ac2, path: 0xe7ca92 },
  { sky: 0xf2d29a, land: 0xe0ba73, edge: 0xab794b, water: 0x4da895, path: 0xf6d9a0 },
  { sky: 0x353c58, land: 0x536070, edge: 0x303848, water: 0x3b537d, path: 0x8a94a6, night: true },
  { sky: 0xeb9d82, land: 0xc48c64, edge: 0x965e61, water: 0x596f9e, path: 0xf4bb8a },
  { sky: 0x282443, land: 0x52516b, edge: 0x383144, water: 0x5265a0, path: 0xa398c6, night: true },
  { sky: 0xc0d8de, land: 0x899098, edge: 0x616978, water: 0x357c99, path: 0xb7bcc1 },
  { sky: 0x847298, land: 0x675c7a, edge: 0x453651, water: 0x494f8c, path: 0xc399aa },
]
const directions = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
}

function terrainHeight(x, z) {
  if (z < 7) return 0
  const slope = THREE.MathUtils.smoothstep(z, 7, 16)
  const rim = 1 - THREE.MathUtils.smoothstep(Math.abs(x), 12, 20)
  return slope * rim * (2.1 + .65 * Math.cos(x * .25))
}

function groundHeight(x, z) {
  if (z < -1.9) return .15
  if (Math.abs(x) < 2.4 && z < 4 || Math.abs(x) < 13.65 && z < 1.38) return .17
  return terrainHeight(x, z)
}

function makeWater() {
  const clock = { value: 0 }
  const tint = { value: new THREE.Color() }
  const geometry = new THREE.PlaneGeometry(260, 260).rotateX(-Math.PI / 2)
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .34 })
  material.onBeforeCompile = shader => {
    shader.uniforms.waterTime = clock
    shader.uniforms.waterTint = tint
    shader.vertexShader = 'varying vec3 waterPosition;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nwaterPosition = position;')
    shader.fragmentShader = `
      varying vec3 waterPosition;
      uniform float waterTime;
      uniform vec3 waterTint;
    ` + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      vec2 p = waterPosition.xz;
      float drift = sin(p.x * .24 - p.y * .19 + waterTime * .47);
      float wave = sin(p.x * .85 + p.y * 1.65 + drift * 1.9 + waterTime * 1.65)
                 + sin(p.x * 1.7 - p.y * 1.1 + drift * 2.7 - waterTime * 1.2) * .7;
      float crest = smoothstep(1.16, 1.65, wave);
      float shore = exp(-max(0.0, -p.y - 1.7) * .22) * (1.0 - smoothstep(16.0, 24.0, abs(p.x)));
      float sunAxis = (p.x + 7.0 - p.y * .27) * .16;
      float sunPath = exp(-sunAxis * sunAxis);
      vec3 deep = waterTint * (.73 + .13 * wave);
      vec3 shoal = mix(waterTint, vec3(.09, .72, .51), .65);
      diffuseColor.rgb = mix(deep, shoal, shore * .85);
      diffuseColor.rgb += crest * (.024 + sunPath * .14 + shore * .08);
    `)
  }
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = -.29
  return { mesh, clock, tint }
}

function modelAt(source, height, x, z, y = 0) {
  const model = source.clone(true)
  const bounds = new THREE.Box3().setFromObject(model)
  const scale = height / (bounds.max.y - bounds.min.y)
  const center = bounds.getCenter(new THREE.Vector3())
  model.scale.multiplyScalar(scale)
  model.position.set(x - center.x * scale, y - bounds.min.y * scale, z - center.z * scale)
  return model
}

export async function createWorld(container, { onDock, onFish, inputBlocked }) {
  const loader = new GLTFLoader()
  const names = ['character-a', 'bridge-center-wood', 'tree-oak', 'rock-largea', 'grass']
  const [person, bridge, tree, rock, grass] = await Promise.all(names.map(async name =>
    (await loader.loadAsync('./assets/' + name + '.glb')).scene))
  for (const model of [bridge, tree, rock, grass]) {
    model.traverse(mesh => {
      if (!mesh.isMesh) return
      for (const material of [mesh.material].flat()) {
        if (material.isMeshStandardMaterial) material.metalness = 0
      }
    })
  }
  tree.traverse(mesh => {
    if (mesh.isMesh && mesh.material.name === 'leafsGreen') mesh.material.color.set(0x63a657)
    if (mesh.isMesh && mesh.material.name === 'woodBark') mesh.material.color.set(0x806046)
  })
  rock.traverse(mesh => {
    if (mesh.isMesh && mesh.material.name === 'dirt') mesh.material.color.set(0x8b8177)
    if (mesh.isMesh && mesh.material.name === 'grass') mesh.material.color.set(0x637a57)
  })
  person.traverse(mesh => {
    if (!mesh.isMesh || !mesh.material.isMeshBasicMaterial) return
    const previous = mesh.material
    mesh.material = new THREE.MeshStandardMaterial({ map: previous.map, color: previous.color, roughness: .82 })
    previous.dispose()
  })
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.shadowMap.autoUpdate = false
  const imageLoader = new THREE.TextureLoader()
  const [sky, dockGrain, meadowGrain] = await Promise.all(
    ['harbor-sky', 'dock-grain', 'meadow-grain'].map(async name => {
      try {
        const texture = await imageLoader.loadAsync('./assets/' + name + '.png')
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
        return texture
      } catch {
        return null
      }
    }),
  )
  if (sky) sky.mapping = THREE.EquirectangularReflectionMapping
  if (meadowGrain) {
    meadowGrain.wrapS = meadowGrain.wrapT = THREE.RepeatWrapping
    meadowGrain.repeat.set(9, 6)
  }
  renderer.domElement.setAttribute('aria-hidden', 'true')
  container.append(renderer.domElement)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 150)
  const cameraTarget = new THREE.Vector3()
  const cameraPosition = new THREE.Vector3()
  const ambient = new THREE.HemisphereLight(0xe2f5ff, 0xa58b6f, 1.9)
  scene.add(ambient)
  const sun = new THREE.DirectionalLight(0xffe4b6, 2.35)
  sun.position.set(-21, 29, 10)
  sun.castShadow = true
  Object.assign(sun.shadow.camera, { left: -31, right: 31, top: 29, bottom: -29, near: .5, far: 85 })
  sun.shadow.camera.updateProjectionMatrix()
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.normalBias = .055
  sun.shadow.bias = -.00025
  scene.add(sun)
  const landscape = new THREE.Group()
  const water = makeWater()
  water.mesh.receiveShadow = true
  scene.add(water.mesh)
  const avatar = new THREE.Group()
  const body = modelAt(person, 2.15, 0, 0)
  const standingHeight = body.position.y
  avatar.add(body)
  const heldRod = new THREE.Mesh(new THREE.CylinderGeometry(.026, .065, 1.7, 7),
    new THREE.MeshStandardMaterial({ color: 0xba793d }))
  heldRod.position.set(-.62, 1.35, .47)
  heldRod.rotation.set(.58, 0, -.18)
  avatar.add(heldRod)
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 18), new THREE.MeshBasicMaterial({
    color: 0x183927, transparent: true, opacity: 0.24, depthWrite: false,
  }))
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.03
  avatar.add(shadow)
  scene.add(landscape, avatar)
  const keys = new Set()
  const pointerMoves = new Map()
  let touchX = 0
  let touchY = 0
  let nearDock
  let obstacles = []
  let buildings = []
  let redraw = true
  let heading = 0
  let zoom = 7.6

  function box(w, h, d, color, x, y, z, map = null) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, map }))
    mesh.castShadow = h >= .3 && h < 7
    mesh.receiveShadow = true
    mesh.position.set(x, y, z)
    landscape.add(mesh)
    return mesh
  }

  function shape(geometry, color, x, y, z, emission = 0) {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, emissive: emission }))
    mesh.position.set(x, y, z)
    mesh.userData.generated = true
    mesh.castShadow = true
    mesh.receiveShadow = true
    landscape.add(mesh)
    return mesh
  }

  function surface(width, start, end, color, offset, map = null) {
    const geometry = new THREE.PlaneGeometry(width, end - start, Math.ceil(width), Math.ceil(end - start))
      .rotateX(-Math.PI / 2).translate(0, 0, (start + end) / 2)
    const vertices = geometry.attributes.position
    for (let i = 0; i < vertices.count; i++) {
      vertices.setY(i, terrainHeight(vertices.getX(i), vertices.getZ(i)) + offset)
    }
    geometry.computeVertexNormals()
    const mesh = shape(geometry, color, 0, 0, 0)
    mesh.material.map = map
    mesh.castShadow = false
  }

  function cottage(x, z, walls, roof) {
    const y = terrainHeight(x, z)
    const part = (w,h,d,color,px,py,pz) => { box(w,h,d,color,x+px,y+py,z+pz).userData.generated = true }
    part(4.65, .55, 3.75, 0x79694f, 0, .03, 0)
    part(4.3, 2.6, 3.4, walls, 0, 1.48, 0)
    const gable = shape(new THREE.CylinderGeometry(2.78, 2.78, 3.95, 3).rotateY(Math.PI), roof, x, y + 3.6, z)
    gable.rotation.x = Math.PI / 2
    gable.scale.set(1, 1, .58)
    for (const dx of [-2.13, 2.13]) part(.15, 2.65, .14, 0x62492f, dx, 1.48, -1.74)
    part(.88, 1.83, .095, 0x765039, 0, 1.11, -1.72)
    for (const dx of [-1.37, 1.37]) {
      part(.93, .85, .11, 0x6d4e39, dx, 1.66, -1.73)
      part(.67, .62, .13, 0xffd783, dx, 1.67, -1.75)
      part(.07, .64, .14, 0x6d4e39, dx, 1.67, -1.77)
    }
    part(.52, 1.48, .55, 0x847064, 1.42, 3.14, .48)
    buildings.push([x, z, 2.4, 2.02])
  }

  function mooredBoat(x, z) {
    const outline = new THREE.Shape()
    outline.moveTo(-.95, -1.75)
    outline.lineTo(.95, -1.75)
    outline.lineTo(1.12, .65)
    outline.lineTo(.7, 1.68)
    outline.lineTo(0, 2.43)
    outline.lineTo(-.7, 1.68)
    outline.lineTo(-1.12, .65)
    outline.closePath()
    const hull = new THREE.ExtrudeGeometry(outline, {
      depth: .48, bevelEnabled: true, bevelThickness: .10, bevelSize: .14, bevelSegments: 1, steps: 1,
    }).rotateX(-Math.PI / 2)
    shape(hull, 0x387897, x, -.35, z)
    const deck = new THREE.ShapeGeometry(outline).rotateX(-Math.PI / 2).scale(.86, 1, .9)
    shape(deck, 0xa57448, x, .145, z)
    for (const dz of [-.77, .43]) {
      shape(new THREE.BoxGeometry(1.76, .18, .36), 0xe0aa66, x, .3, z + dz)
    }
    shape(new THREE.BoxGeometry(.85, .44, .65), 0x574432, x, .36, z + 1.52)
  }

  function boulder(x, y, z, sx, sy, sz, color) {
    const stone = shape(new THREE.DodecahedronGeometry(1, 0), color, x, y, z)
    stone.scale.set(sx, sy, sz)
    return stone
  }

  function stars() {
    const points = []
    for (let i = 0; i < 155; i++) {
      const angle = i * 2.39996
      const y = 12 + i * 7 % 66
      const radius = Math.sqrt(105 ** 2 - y ** 2)
      points.push(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    const skyStars = new THREE.Points(geometry, new THREE.PointsMaterial({
      color: 0xf5efff, size: .33, transparent: true, opacity: .82, fog: false,
    }))
    skyStars.userData.generated = true
    landscape.add(skyStars)
  }

  function landmark(index, ground) {
    switch (index) {
      case 3: {
        // A tiered waterfall and boulders enclose the river mouth.
        for (let i = 0; i < 7; i++) {
          const x = -13 + i * 1.8
          boulder(x, 1.6 + i % 3, -23 - (i % 2), 2.9, 3.3 + i % 3, 3.5, i % 2 ? 0x687771 : 0x4f625a)
        }
        const curtain = shape(new THREE.BoxGeometry(2.6, 5.3, .18), 0x8ddad8, -8.3, 2.41, -19.7, 0x2a6768)
        curtain.rotation.x = -.12
        ground(3.6, .14, 1.45, 0xc1eadf, -8.2, -.17, -18.8)
        for (const [x,z] of [[-4,5],[5,4.2],[-8,9.4],[8,8.1],[11,4.4]]) {
          boulder(x, .42 + terrainHeight(x,z), z, 1.25,.82,1.03, 0x727b69)
          buildings.push([x,z,1.1,.95])
        }
        break
      }
      case 4:
        for (const side of [-1, 1]) {
          for (let i = 0; i < 3; i++) {
            const x = side * (18 + i * 2.7)
            const z = -15 - i * 5.2
            boulder(x, 1.4, z, 4.4, 3.7 + i * .8, 4.8, i % 2 ? 0xa7684a : 0xc38658)
            landscape.add(modelAt(tree, 3.1, x - side * 1.2, z, 3.9 + i * .8))
          }
        }
        for (const side of [-1, 1]) {
          for (let i = 0; i < 6; i++) {
            const x = side * (11.4 + i % 2 * 2.5)
            const z = 5 + i * 2.7
            boulder(x, 1.5 + terrainHeight(x,z), z, 2.9, 3.5 + i % 3, 2.6, i % 2 ? 0xb86f50 : 0x9b6654)
            buildings.push([x,z,2.2,2])
          }
          ground(.47, 3.7, .48, 0xa53e2d, side * 2.2, 1.85, 5.5)
        }
        ground(5.6, .48, .52, 0xb54a2c, 0, 3.48, 5.5)
        ground(6.2, .31, .65, 0x60362d, 0, 3.88, 5.5)
        cottage(-6, 13, 0xe9c78d, 0x833629)
        break
      case 5: {
        stars()
        for (let i = 0; i < 11; i++) {
          const x = i % 2 ? 10 + i * .67 : -10 - i * .76
          const z = -9 - i * 1.7
          boulder(x, .49, z, 2.9, 1.28 + i % 3 * .52, 2.1, i % 2 ? 0xbbe8f3 : 0xe2f4f5)
        }
        for (let band = 0; band < 3; band++) {
          const vertices = []
          for (let i = 0; i < 34; i++) {
            const x = i * 2.7 - 44
            const height = 15 + band * 2.1 + Math.sin(i * .26 + band * .6) * 2.4
            for (const y of [height, height + 1.5 + Math.sin(i * .35) * .8]) vertices.push(x,y,-46 - band * 5)
          }
          const indices = []
          for (let i = 0; i < vertices.length / 3 - 2; i += 2) indices.push(i,i+1,i+2,i+2,i+1,i+3)
          const geometry = new THREE.BufferGeometry()
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
          geometry.setIndex(indices)
          const ribbon = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            color: [0x69ffc0,0x80b8ff,0xbd83fc][band], transparent: true, opacity: .35,
            side: THREE.DoubleSide, depthWrite: false, fog: false,
          }))
          ribbon.userData.generated = true
          landscape.add(ribbon)
        }
        cottage(6, 11, 0xb5cbd1, 0x65718b)
        break
      }
      case 6:
        boulder(-14, 2.5, -23, 8.4, 5.5, 5.8, 0x413441)
        shape(new THREE.CylinderGeometry(1.9, 6.8, 9.3, 8), 0x432e38, -14, 8.4, -23)
        shape(new THREE.CylinderGeometry(1.75, 1.8, .18, 10), 0xff883d, -14, 13.1, -23, 0xa42d12)
        for (let i = 0; i < 8; i++) {
          const x = -14 + i * .41
          const height = 12.8 - i * 1.21
          const crest = shape(new THREE.BoxGeometry(.56, 1.77, .19), 0xff813f, x, height, -20.7 + i * .49, 0xe94a15)
          crest.rotation.set(-.27,0,-.27)
        }
        for (let i = 0; i < 8; i++) {
          const x = (i % 2 ? 1 : -1) * (6.4 + i % 3 * 2)
          const z = 4.4 + i * 1.85
          const y = terrainHeight(x,z)
          shape(new THREE.CylinderGeometry(.51,1.16,2.1+i%3,5),0x352e40,x,y + 1,z)
          buildings.push([x,z,.96,.96])
        }
        break
      case 7:
        for (const [x,z] of [[-6,4],[6,6],[-10,12],[11,14],[-5,-12],[7,-16]]) {
          const y = z < 0 ? -.22 : terrainHeight(x,z)
          if (z >= 0) {
            const trunk = shape(new THREE.CylinderGeometry(.13,.29,3.6,7), 0xa6845d,x,y+1.7,z)
            trunk.rotation.z = .14
            buildings.push([x,z,.51,.51])
            for(let branch=0;branch<6;branch++){
              const a=branch*Math.PI/3
              const leaf=shape(new THREE.SphereGeometry(1,9,5), branch%2 ? 0x469961 : 0x65af66,
                x+Math.sin(a)*.91-.24,y+3.52,z+Math.cos(a)*.91)
              leaf.scale.set(.35,.2,1.34)
              leaf.rotation.set(.18,a,0,'YXZ')
            }
          } else {
            for(let j=0;j<5;j++){
              const coral = shape(new THREE.CylinderGeometry(.08,.21,1.5+j%3*.45,5),
                [0xf4879b,0xf9ad85,0xc7aafa][j%3],x+(j-2)*.36,y+.55,z+j%2*.3)
              coral.rotation.z = (j-2)*.28
            }
          }
        }
        mooredBoat(5.9, -11.3)
        break
      case 8:
        stars()
        shape(new THREE.SphereGeometry(3,16,10),0xffefd2,16,19,-58,0xf0cfa4).castShadow = false
        for (let i = 0; i < 7; i++) {
          const angle = i * Math.PI / 6
          const stone = boulder(-14 + Math.cos(angle)*5,1+Math.sin(angle)*7,-22,2.25,2.15,2.1,0x35354f)
          stone.rotation.z = angle
        }
        for (const x of [-5.2, 5.2]) {
          ground(.37,4,.37,0x3c3e61,x,1.95,4)
          shape(new THREE.OctahedronGeometry(.43),0x99cffc,x,4.15,4,0x427cb6)
        }
        break
    }
  }

  function changeArea(index) {
    landscape.traverse(object => {
      if (object.userData.generated) {
        object.geometry.dispose()
        object.material.dispose()
      }
    })
    landscape.clear()
    const colors = palettes[index]
    const daylight = index !== 2 && !colors.night
    const areaSky = index < 9 ? sky : null
    scene.background = daylight && areaSky ? areaSky : new THREE.Color(colors.sky)
    scene.backgroundRotation.y = index === 1 ? -.64 : .35 + index * .16
    sun.color.set(index === 6 ? 0xffab83 : daylight ? 0xffe4b6 : 0xaabfff)
    sun.intensity = daylight ? 2.35 : 1.45
    ambient.color.set(daylight ? 0xe2f5ff : 0xaac6ff)
    tree.traverse(mesh => { if (mesh.isMesh && mesh.material.name === 'leafsGreen') mesh.material.color.set(colors.canopy ?? 0x63a657) })
    scene.fog = new THREE.Fog(colors.sky, index === 9 ? 13 : 30, index === 9 ? 64 : 112)
    water.tint.value.set(colors.water)
    const ground = (...args) => { box(...args).userData.generated = true }
    ground(40, 1.6, 25, colors.edge, 0, -1, 10.5)
    const grassTexture = index === 0 || colors.grass ? meadowGrain : null
    surface(40, -2, 23, grassTexture ? 0xd5dec0 : colors.land, 0, grassTexture)
    surface(3.6, -2, 23, colors.path, .018)
    buildings = []
    for (let i = 0; i < 11; i++) {
      const x = -18 + i * 3.6
      if (Math.abs(x) < 2.7) continue
      ground(3.7, .18, 1.6 + i % 3 * .25, 0xd2b481, x, -.095, -1.5)
    }
    const wood = dockGrain ? [0xe1c4aa, 0xffe0be, 0xffe9cc, 0xd3b7a0]
      : [0xa87547, 0xb28153, 0xbc8c5b, 0x9d6b43]
    for (let i = 0; i < 34; i++) {
      ground(4.8, 0.22, 0.39, wood[i % 4], 0, .04, 3.8 - i * .414, dockGrain)
    }
    // The quay branches in both directions before the main fishing pier.
    for (let i = 0; i < 65; i++) {
      ground(.39, .24, 3.5, wood[(i + 1) % 4], (i - 32) * .42, .06, -.37, dockGrain)
    }
    for (let i = 0; i < 31; i++) {
      ground(.39, .22, 2.8, wood[i % 4], -2 - i * .42, .04, -6, dockGrain)
    }
    for (const x of [-5.4, -9.9, -14.3]) {
      for (const z of [-7.36, -4.64]) ground(.32, 1.9, .32, 0x705236, x, .3, z)
      ground(.14, 3.25, .14, 0x61482f, x, 1.46, -7.36)
      ground(.43, .5, .43, 0xffe6ac, x, 3.02, -7.36)
      ground(.56, .12, .56, 0x65482d, x, 3.32, -7.36)
    }
    for (let i = 0; i < 5; i++) {
      const tile = modelAt(bridge, 0.3, 0, -2.7 - i * 1.7, -0.05)
      const size = new THREE.Box3().setFromObject(tile).getSize(new THREE.Vector3())
      tile.scale.x *= 5 / size.x
      tile.scale.z *= 1.7 / size.z
      tile.position.y -= .12
      landscape.add(tile)
    }
    for (const x of [-2.3, 2.3]) for (const z of [-2.4, -9.8]) {
      ground(0.32, 1.45, 0.32, 0x67492f, x, 0.24, z)
      ground(0.39, 0.17, 0.39, 0xffd873, x, 0.98, z)
    }
    for (const x of [-13.4, -9.2, -5.6, 5.6, 9.2, 13.4]) {
      ground(.28, 1.18, .28, 0x755236, x, .46, -2.13)
      if (Math.abs(x) !== 9.2) continue
      ground(.14, 3.1, .14, 0x604630, x, 1.55, -2.13)
      ground(.43, .53, .43, 0xffe4a7, x, 3.08, -2.13)
      ground(.53, .13, .53, 0x62452d, x, 3.4, -2.13)
    }
    for (const x of [-2.38, 2.38]) {
      ground(.15, .12, 7.8, 0xd7a46b, x, .18, -5.8)
    }
    if (index <= 1 || index >= 7) {
      mooredBoat(-6.9, -10.6)
      mooredBoat(6.5, -6.25)
    }
    for (let i = 0; i < 4; i++) {
      const x = (i % 2 === 0 ? 1 : -1) * (23 + i * 5)
      const z = -29 - i * 6
      const island = shape(new THREE.DodecahedronGeometry(1, 0), colors.edge, x, -.38, z)
      island.scale.set(7.2 + i, 1.5, 4.8)
      island.rotation.y = i * .71
      const crest = shape(new THREE.DodecahedronGeometry(1, 0), colors.land, x, .33, z)
      crest.scale.set(6.75 + i, 1.72, 4.34)
      crest.rotation.y = island.rotation.y
      for (let j = 0; j < 3; j++) {
        landscape.add(modelAt(index === 2 ? rock : tree, 2.9 + j * .67, x - 3.6 + j * 2.7, z + j % 2, 1.15))
      }
    }
    if (daylight && !areaSky) {
      for (let i = 0; i < 8; i++) {
        const x = -44 + i * 13
        const z = -47 - i % 3 * 6
        for (let j = 0; j < 3; j++) {
          const cloud = new THREE.Mesh(new THREE.SphereGeometry(1, 9, 6),
            new THREE.MeshBasicMaterial({ color: 0xf0f7fb }))
          cloud.userData.generated = true
          cloud.position.set(x + j * 3.8, 13 + i % 3 * 3 + Math.sin(j * 2) * 1.1, z)
          cloud.scale.set(4.4, .85 + j % 2 * .55, 1.6)
          landscape.add(cloud)
        }
      }
    }
    const marker = new THREE.Mesh(new THREE.RingGeometry(.79, .94, 30),
      new THREE.MeshBasicMaterial({ color: 0xffe279, side: THREE.DoubleSide }))
    marker.userData.generated = true
    marker.rotation.x = -Math.PI / 2
    marker.position.set(0, .177, -8.45)
    landscape.add(marker)
    obstacles = [[-7, 1], [8, 1], [-14, 4], [14, 7], [-9, 12], [9, 14], [-16, 17], [16, 18],
      [-7, 20], [6, 21], [-4, 7], [4.5, 8]]
    for (const [i, [x, z]] of obstacles.entries()) {
      const isTree = [0, 3, 4, 5, 9, 10, 11, 14].includes(index) && i < 10
      const height = isTree ? 2.7 + i % 3 : i > 9 ? 0.65 : 0.95 + i % 3 * 0.35
      landscape.add(modelAt(isTree ? tree : rock, height, x, z, terrainHeight(x,z)))
    }
    for (let i = 0; i < 28; i++) {
      const side = i % 2 ? 1 : -1
      const x = side * (3.4 + i * 7 % 15)
      const z = 0.5 + i * 11 % 22
      landscape.add(modelAt(grass, 0.24 + i % 3 * 0.12, x, z, terrainHeight(x,z)))
    }
    if (index <= 1) {
      cottage(-6.7, 10, 0xe7bd81, index === 1 ? 0x334d73 : 0x943d35)
      cottage(7.2, 12.5, 0xf0d5a8, index === 1 ? 0x27746a : 0x425e38)
      cottage(-10.7, 17, 0xd3996d, 0x6e473c)
      for (const [x,z] of [[-4,2.3],[4.4,2.4],[-7,2.8],[7,1.7]]) {
        ground(.69,.67,.69,0x79543d,x,.34,z)
        ground(.74,.105,.74,0xb38154,x,.65,z)
      }
    } else if (index === 2) {
      for (const side of [-1, 1]) {
        for (let i = 0; i < 6; i++) {
          const x = side * (10.3 + i % 2 * 3)
          const z = 8.6 + i * 2.4
          const slab = shape(new THREE.DodecahedronGeometry(1.7, 0), i % 2 ? 0x423756 : 0x55516d,
            x, terrainHeight(x, z) + 1.8, z)
          slab.scale.set(2.3, 2.6 + i % 3 * .5, 1.8)
          slab.rotation.y = i * .53
          buildings.push([x, z, 2.6, 2])
        }
      }
      for (const x of [-5, 0, 5]) {
        const arch = shape(new THREE.DodecahedronGeometry(2, 0), 0x443a59, x, 8.2, 17)
        arch.scale.set(2.2, .93, 1.55)
        arch.rotation.z = x * .04
      }
      for (let i = 0; i < 18; i++) {
        const x = (i % 2 ? 1 : -1) * (3.9 + i * 11 % 13)
        const z = 4.5 + i * 7 % 16
        const y = terrainHeight(x,z)
        const crystal = shape(new THREE.OctahedronGeometry(.62), i % 3 ? 0x56d9fa : 0xd388ff,
          x, y + .76, z, i % 3 ? 0x176070 : 0x551f85)
        crystal.scale.y = 1.65 + i % 3 * .4
        crystal.rotation.z = (i % 3 - 1) * .23
      }
      const glow = new THREE.PointLight(0x68d7ed, 44, 17, 1.6)
      glow.position.set(-4.2, 3.1, 11.7)
      landscape.add(glow)
    }
    if (index < 9) {
      landmark(index, ground)
    } else {
      const scenery = [
        [0x768340, 11, .10, 1.4], [0x83a648, 14, .16, 3.2],
        [0xf2ead0, 3, .32, 3.5], [0xe9a866, 7, .78, 1.3],
        [0x8e9fda, 4, .24, 4.1], [0xffb173, 5, .65, 2.3],
        [0xc9a8ff, 9, .45, 2.5], [0xc1cbd1, 7, 1.35, 3.8],
        [0xffce98, 8, .65, 2.8],
      ]
      const [color, count, width, height] = scenery[index - 9]
      for (let i = 0; i < count; i++) {
        const x = (i % 2 ? 1 : -1) * (8 + i * 7 % 10)
        const z = 8 + i * 5 % 14
        const y = terrainHeight(x, z)
        const size = height * (.65 + i % 4 * .16)
        const accent = shape(new THREE.CylinderGeometry(width * .25, width, size, 5),
          color, x, y + size / 2, z)
        accent.rotation.z = (i % 3 - 1) * .12
      }
    }
    landscape.traverse(object => {
      if (!object.isMesh || object.userData.generated) return
      object.castShadow = true
      object.receiveShadow = true
    })
    renderer.shadowMap.needsUpdate = true
    avatar.position.set(0, groundHeight(0, 5), 5)
    avatar.rotation.y = Math.PI
    heading = 0
    cameraPosition.set(0, 4.6, 12.6)
    redraw = true
    updateDock()
  }

  function updateDock() {
    const available = avatar.position.z < -4.1
    if (available !== nearDock) {
      nearDock = available
      onDock(available)
    }
  }

  function move(horizontal, forward) {
    const cos = Math.cos(heading)
    const sin = Math.sin(heading)
    const dx = horizontal * cos + forward * sin
    const dz = forward * cos - horizontal * sin
    avatar.rotation.y = Math.atan2(dx, dz)
    function canWalk(x, z) {
      return Math.abs(x) <= 19.6 && z <= 22.6 && z >= -9.8 &&
        (z >= -1.9 || Math.abs(x) <= 2.05 || (x >= -14.2 && x < 0 && Math.abs(z + 6) <= 1.24)) &&
        buildings.every(([bx, bz, w, d]) => Math.abs(x - bx) > w || Math.abs(z - bz) > d) &&
        obstacles.every(([ox, oz]) => Math.hypot(x - ox, z - oz) > 0.85)
    }
    const p = avatar.position
    if (canWalk(p.x + dx, p.z)) p.x += dx
    if (canWalk(p.x, p.z + dz)) p.z += dz
    p.y = groundHeight(p.x, p.z)
    redraw = true
    updateDock()
  }

  window.addEventListener('keydown', event => {
    if (inputBlocked() || event.altKey || event.ctrlKey || event.metaKey ||
        event.target?.closest?.('input, select, textarea')) return
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    if (key === 'e' && nearDock && !event.repeat) {
      event.preventDefault()
      onFish()
    }
    if (key === 'q' || key === 'r') {
      heading += key === 'q' ? .2 : -.2
      redraw = true
    }
    if (!Object.hasOwn(directions, key)) return
    event.preventDefault()
    keys.add(key)
  })
  window.addEventListener('keyup', event => keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key))
  function clearMovement() {
    keys.clear()
    pointerMoves.clear()
    touchX = 0
    touchY = 0
  }
  window.addEventListener('blur', clearMovement)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearMovement()
  })
  const canvas = renderer.domElement
  let pointer
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointer || inputBlocked()) return
    if (event.pointerType === 'touch') {
      const bounds = canvas.getBoundingClientRect()
      if (event.clientX < bounds.left + bounds.width / 2) return
    }
    pointer = { id: event.pointerId, x: event.clientX }
    canvas.setPointerCapture(event.pointerId)
    canvas.classList.add('orbiting')
  })
  canvas.addEventListener('pointermove', event => {
    if (pointer?.id !== event.pointerId) return
    heading -= (event.clientX - pointer.x) * .009
    pointer.x = event.clientX
    redraw = true
  })
  canvas.addEventListener('lostpointercapture', () => {
    pointer = null
    canvas.classList.remove('orbiting')
  })
  canvas.addEventListener('wheel', event => {
    event.preventDefault()
    zoom = THREE.MathUtils.clamp(zoom + Math.sign(event.deltaY) * .65, 4.5, 12)
    redraw = true
  }, { passive: false })
  new ResizeObserver(() => {
    const { clientWidth: width, clientHeight: height } = container
    if (!width || !height) return
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    redraw = true
  }).observe(container)

  let previousTime = 0
  let lastRender = 0
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  renderer.setAnimationLoop(time => {
    const dt = Math.min((time - previousTime) / 1000, 0.05)
    previousTime = time
    if (inputBlocked()) clearMovement()
    let dx = touchX
    let dz = touchY
    for (const key of new Set([...keys, ...pointerMoves.values()])) {
      dx += directions[key][0]
      dz += directions[key][1]
    }
    const length = Math.hypot(dx, dz)
    if (length) move(dx / Math.max(1, length) * dt * 5.5, dz / Math.max(1, length) * dt * 5.5)
    const height = standingHeight + (length && !reducedMotion.matches ? Math.abs(Math.sin(time / 85)) * 0.12 : 0)
    if (body.position.y !== height) {
      body.position.y = height
      redraw = true
    }
    const { x, y, z } = avatar.position
    cameraTarget.set(x + Math.sin(heading) * zoom, y + 4.6 + (zoom - 7.6) * .27, z + Math.cos(heading) * zoom)
    if (cameraPosition.distanceToSquared(cameraTarget) > 0.0001) {
      cameraPosition.lerp(cameraTarget, reducedMotion.matches ? 1 : 1 - Math.exp(-11 * dt))
      redraw = true
    }
    const animateWater = !document.hidden && !inputBlocked() && !reducedMotion.matches
    if (!redraw && (!animateWater || time - lastRender < 1000 / 24)) return
    if (animateWater) water.clock.value = time / 1000
    camera.position.copy(cameraPosition)
    camera.lookAt(x - Math.sin(heading) * 2.6, y + 1.4, z - Math.cos(heading) * 2.6)
    renderer.render(scene, camera)
    lastRender = time
    redraw = false
  })
  return {
    changeArea,
    goToDock() {
      avatar.position.set(0, groundHeight(0, -6), -6)
      avatar.rotation.y = Math.PI
      heading = 0
      cameraPosition.set(0, 4.75 + (zoom - 7.6) * .27, -6 + zoom)
      redraw = true
      updateDock()
    },
    setTouchMovement(x, y) {
      touchX = x
      touchY = y
    },
    moveWithPointer(id, key) {
      if (key) pointerMoves.set(id, key)
      else pointerMoves.delete(id)
    },
    step(key) {
      const [dx, dz] = directions[key]
      move(dx * 0.85, dz * 0.85)
    },
  }
}
