// ─── Constants — static data only, no imports ─────────────────────────────────

export const BUILTIN_DECKS = [
  { id: 'b-capitals', name: 'World Capitals', pairs: [
    {k:'France',v:'Paris'},{k:'Japan',v:'Tokyo'},{k:'Germany',v:'Berlin'},
    {k:'Brazil',v:'Brasilia'},{k:'Australia',v:'Canberra'},{k:'Canada',v:'Ottawa'},
    {k:'Italy',v:'Rome'},{k:'Spain',v:'Madrid'},{k:'China',v:'Beijing'},
    {k:'India',v:'New Delhi'},{k:'Mexico',v:'Mexico City'},{k:'Egypt',v:'Cairo'},
    {k:'Russia',v:'Moscow'},{k:'UK',v:'London'},{k:'Greece',v:'Athens'},
    {k:'Norway',v:'Oslo'},{k:'Poland',v:'Warsaw'},{k:'Thailand',v:'Bangkok'},
    {k:'Kenya',v:'Nairobi'},{k:'Argentina',v:'Buenos Aires'}
  ]},
  { id: 'b-math', name: 'Multiplication', pairs: [
    {k:'3 × 3',v:'9'},{k:'3 × 4',v:'12'},{k:'4 × 4',v:'16'},{k:'4 × 6',v:'24'},
    {k:'6 × 6',v:'36'},{k:'6 × 7',v:'42'},{k:'7 × 7',v:'49'},{k:'7 × 8',v:'56'},
    {k:'8 × 8',v:'64'},{k:'8 × 9',v:'72'},{k:'9 × 9',v:'81'},{k:'6 × 8',v:'48'}
  ]},
  { id: 'b-elements', name: 'Elements', pairs: [
    {k:'H',v:'Hydrogen'},{k:'He',v:'Helium'},{k:'Li',v:'Lithium'},{k:'C',v:'Carbon'},
    {k:'N',v:'Nitrogen'},{k:'O',v:'Oxygen'},{k:'Na',v:'Sodium'},{k:'Fe',v:'Iron'},
    {k:'Au',v:'Gold'},{k:'Ag',v:'Silver'},{k:'Cu',v:'Copper'},{k:'K',v:'Potassium'},
    {k:'Ca',v:'Calcium'},{k:'Mg',v:'Magnesium'},{k:'Al',v:'Aluminium'},{k:'Zn',v:'Zinc'}
  ]}
];

export const T9_MAP = {
  '2':['a','b','c'],'3':['d','e','f'],'4':['g','h','i'],
  '5':['j','k','l'],'6':['m','n','o'],'7':['p','q','r','s'],
  '8':['t','u','v'],'9':['w','x','y','z']
};

export const T9_KEYS = [
  {n:'1',l:'',id:'t9-key-next'},{n:'2',l:'ABC'},{n:'3',l:'DEF'},
  {n:'4',l:'GHI'},{n:'5',l:'JKL'},{n:'6',l:'MNO'},
  {n:'7',l:'PQRS'},{n:'8',l:'TUV'},{n:'9',l:'WXYZ'},
  {n:'⌫',l:'',a:'back'},{n:'0',l:''},{n:'✓',l:'',a:'ok'}
];

export const TTYPES = [
  {name:'Basic', color:'#4488ff',glow:'#4488ff',range:95, dmg:14,rate:1.4, streak:0},
  {name:'Rapid', color:'#ff44aa',glow:'#ff44aa',range:62, dmg:7, rate:0.45,streak:3},
  {name:'Sniper',color:'#ffaa00',glow:'#ffaa00',range:165,dmg:38,rate:2.4, streak:5},
  {name:'Splash',color:'#44ffaa',glow:'#44ffaa',range:82, dmg:18,rate:1.6, streak:8, splash:true}
];

export const TR = 14;
export const ER_X = 11, ER_Y = 8, PR = 4;
export const RING_ANGLES = 12;
export const RINGS = [1.22, 1.46];
