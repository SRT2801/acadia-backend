export enum UniversitiesEnum {
  UNICOLOMBO = 'unicolombo.edu.co',
  UNAL = 'unal.edu.co',
  UNIANDES = 'uniandes.edu.co',
  JAVERIANA = 'javeriana.edu.co',
  UNINORTE = 'uninorte.edu.co',
}

export const ALL_UNIVERSITIES = [
  {
    name: 'Fundación Universitaria Colombo Internacional',
    domain: UniversitiesEnum.UNICOLOMBO,
    city: 'Cartagena',
    country: 'Colombia',
  },
  {
    name: 'Universidad Nacional de Colombia',
    domain: UniversitiesEnum.UNAL,
    city: 'Bogotá',
    country: 'Colombia',
  },
  {
    name: 'Universidad de los Andes',
    domain: UniversitiesEnum.UNIANDES,
    city: 'Bogotá',
    country: 'Colombia',
  },
  {
    name: 'Pontificia Universidad Javeriana',
    domain: UniversitiesEnum.JAVERIANA,
    city: 'Bogotá',
    country: 'Colombia',
  },
  {
    name: 'Universidad del Norte',
    domain: UniversitiesEnum.UNINORTE,
    city: 'Barranquilla',
    country: 'Colombia',
  },
];
