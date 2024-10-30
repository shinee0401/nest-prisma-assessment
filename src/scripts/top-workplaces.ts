import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

// Define the URLs
const WORKPLACES_URL = "http://localhost:3000/workplaces";
const SHIFTS_URL = "http://localhost:3000/shifts";

interface Workplace {
  id: string;
  name: string;
}

interface Shift {
  workplaceId: string;
  workerId: string;
}

interface TopWorkPlaces {
  name: string;
  shifts: number;
}

@Injectable()
export class TopWorkplacesService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * Fetches top workplaces based on shift counts.
   * @returns {Promise<TopWorkPlaces[]>} List of top workplaces.
   */
  async getTopWorkplaces(): Promise<TopWorkPlaces[]> {
    try {
      // Fetch workplaces and shifts concurrently
      const [workplaces, shifts] = await Promise.all([
        this.fetchData<Workplace[]>(WORKPLACES_URL),
        this.fetchData<Shift[]>(SHIFTS_URL),
      ]);

      // Count shifts for each workplace
      const shiftCounts = this.countShifts(shifts);
      return this.getTopThreeWorkplaces(workplaces, shiftCounts);
    } catch (error) {
      console.error("Error fetching workplaces:", error);
      return [];
    }
  }

  /**
   * Fetches data from a given URL.
   * @template T
   * @param {string} url - The URL to fetch data from.
   * @returns {Promise<T>} The fetched data.
   */
  private async fetchData<T>(url: string): Promise<T> {
    const response = await lastValueFrom(this.httpService.get(url));
    return response.data.data;
  }

  /**
   * Counts shifts for each workplace.
   * @param {Shift[]} shifts - List of shifts.
   * @returns {Record<string, number>} Shift counts by workplace ID.
   */
  private countShifts(shifts: Shift[]): Record<string, number> {
    return shifts.reduce(
      (acc, { workplaceId }) => {
        acc[workplaceId] = (acc[workplaceId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Gets the top three workplaces based on shift counts.
   * @param {Workplace[]} workplaces - List of workplaces.
   * @param {Record<string, number>} shiftCounts - Shift counts by workplace ID.
   * @returns {TopWorkPlaces[]} List of top workplaces.
   */
  private getTopThreeWorkplaces(
    workplaces: Workplace[],
    shiftCounts: Record<string, number>
  ): TopWorkPlaces[] {
    return workplaces
      .map(({ id, name }) => ({ name, shifts: shiftCounts[id] || 0 }))
      .sort((a, b) => b.shifts - a.shifts)
      .slice(0, 3);
  }
}

async function run() {
  const service = new TopWorkplacesService(new HttpService());
  const topWorkplaces = await service.getTopWorkplaces();

  // Use proper logging in production
  console.log(topWorkplaces);
}

run();
