const CITY_NAMES = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose',
  'Austin',
  'Jacksonville',
  'Fort Worth',
  'Columbus',
  'Charlotte',
  'San Francisco',
  'Indianapolis',
  'Seattle',
  'Denver',
  'Washington',
  'Boston',
  'Nashville',
  'Portland',
  'Las Vegas',
  'Detroit',
  'Memphis',
  'Louisville',
  'Baltimore',
  'Milwaukee',
  'Albuquerque',
  'Tucson',
  'Fresno',
  'Sacramento',
  'Kansas City',
  'Mesa',
  'Atlanta',
  'Omaha',
  'Colorado Springs',
  'Raleigh',
  'Miami',
];

/** @gqlType */
class City {
  constructor(
    /** @gqlField */
    readonly name: string,
  ) {}
}

/**
 * Searches for a city by name
 *
 * @gqlQueryField
 */
export function cities(query: string): City[] {
  return CITY_NAMES.filter((c) => c.startsWith(query)).map((c) => new City(c));
}
