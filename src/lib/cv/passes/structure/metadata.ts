import type { DifferenceOfGaussians } from "../../models/DifferenceOfGaussians";
import type { Sobel } from "../../models/Sobel";

export interface Metadata{
    index: number;
    sobel: Sobel;
    dog: DifferenceOfGaussians;
    strongestNeighborIndex: number;
    strongestNeighborScore: number;
    secondStrongestNeighborIndex: number;
    secondStrongestNeighborScore: number;
    score: number;
}